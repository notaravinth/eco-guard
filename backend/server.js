const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const { checkNDVI } = require("./satellite");
const multer = require("multer");
const fetch = require("node-fetch");
const FormData = require("form-data");
const { createClient } = require("@supabase/supabase-js");
const { checkInvasive } = require("./invasiveSpecies");

const app = express();
app.use(cors()); // allow all origins in dev — lock down in production
app.use(express.json());

// Service-role client — bypasses RLS, backend only
const adminSupabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Haversine distance in km between two lat/lng points
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ESCALATION_THRESHOLD = 5; // escalate cluster after this many sightings
const upload = multer();

app.post("/satellite-check", (req, res) => {
  const { latitude, longitude, radius } = req.body;

  // ✅ Validate inputs
  if (!latitude || !longitude || !radius) {
    return res.status(400).json({
      error: "Missing required fields: latitude, longitude, radius",
    });
  }

  console.log(
    `📍 Checking: lat=${latitude}, lon=${longitude}, radius=${radius}`,
  );

  checkNDVI(latitude, longitude, radius, (result) => {
    console.log("📊 Result:", result);
    res.json(result);
  });
});

/* ===========================
   🔹 PLANT IDENTIFICATION via trained H5 model
   Proxies the image to model_server.py (port 5002)
=========================== */
const MODEL_SERVER_URL = process.env.MODEL_SERVER_URL || "http://localhost:5002";

app.post("/predict", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    // Forward image to Python model server
    const form = new FormData();
    form.append("image", req.file.buffer, {
      filename: req.file.originalname || "plant.jpg",
      contentType: req.file.mimetype || "image/jpeg",
    });

    console.log("[Model] Sending image to Python model server …");

    const response = await fetch(`${MODEL_SERVER_URL}/predict`, {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Model] Server error:", response.status, errText);
      return res.status(502).json({
        error: `Model server error (${response.status})`,
        details: errText,
      });
    }

    const result = await response.json();
    console.log(
      `[Model] Identified: ${result.species} (${(result.confidence * 100).toFixed(1)}%) | Invasive: ${result.invasive}`,
    );

    res.json(result);
  } catch (err) {
    console.error("❌ Prediction error:", err.message);
    res.status(500).json({
      error: "Plant identification failed: " + err.message,
    });
  }
});

/* ===========================
   🔹 CLUSTERING + ESCALATION
   Called by frontend after satellite verification
=========================== */
app.post("/handle-cluster", async (req, res) => {
  const { sighting_id, species_name, latitude, longitude } = req.body;

  if (!sighting_id || !species_name || latitude == null || longitude == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 1. Fetch all active clusters for this species
    const { data: clusters, error: fetchErr } = await adminSupabase
      .from("clusters")
      .select("*")
      .eq("species_name", species_name)
      .eq("status", "active");

    if (fetchErr) throw fetchErr;

    // 2. Find the nearest cluster within its radius
    let matchedCluster = null;
    for (const cluster of clusters) {
      const dist = haversineKm(
        latitude,
        longitude,
        cluster.center_lat,
        cluster.center_lng,
      );
      if (dist <= cluster.radius_km) {
        matchedCluster = cluster;
        break;
      }
    }

    let clusterId;
    let newCount;

    if (matchedCluster) {
      // 3a. Increment existing cluster
      newCount = matchedCluster.sighting_count + 1;
      const updatePayload = {
        sighting_count: newCount,
        updated_at: new Date().toISOString(),
      };

      if (newCount >= ESCALATION_THRESHOLD) {
        updatePayload.status = "escalated";
        updatePayload.escalated_at = new Date().toISOString();
      }

      const { error: updateErr } = await adminSupabase
        .from("clusters")
        .update(updatePayload)
        .eq("id", matchedCluster.id);

      if (updateErr) throw updateErr;
      clusterId = matchedCluster.id;
      console.log(`[Cluster] Updated cluster ${clusterId} → count ${newCount}`);
    } else {
      // 3b. Create new cluster centred on this sighting
      const { data: newCluster, error: insertErr } = await adminSupabase
        .from("clusters")
        .insert({
          species_name,
          center_lat: latitude,
          center_lng: longitude,
          radius_km: 5.0,
          sighting_count: 1,
          status: "active",
        })
        .select()
        .single();

      if (insertErr) throw insertErr;
      clusterId = newCluster.id;
      newCount = 1;
      console.log(
        `[Cluster] Created new cluster ${clusterId} for ${species_name}`,
      );
    }

    // 4. Link sighting → cluster
    const sightingUpdate = { cluster_id: clusterId };
    if (newCount >= ESCALATION_THRESHOLD) {
      sightingUpdate.status = "escalated";
    }

    const { error: linkErr } = await adminSupabase
      .from("sightings")
      .update(sightingUpdate)
      .eq("id", sighting_id);

    if (linkErr) throw linkErr;

    // 5. If escalated, mark ALL sightings in this cluster as escalated
    if (newCount >= ESCALATION_THRESHOLD) {
      await adminSupabase
        .from("sightings")
        .update({ status: "escalated" })
        .eq("cluster_id", clusterId);
      console.log(`[Cluster] ⚠️ Cluster ${clusterId} ESCALATED`);
    }

    res.json({
      cluster_id: clusterId,
      sighting_count: newCount,
      escalated: newCount >= ESCALATION_THRESHOLD,
    });
  } catch (err) {
    console.error("[Cluster] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
