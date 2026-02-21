require("dotenv").config();
const express = require("express");
const { checkNDVI } = require("./satellite");
const multer = require("multer");
const fetch = require("node-fetch");
const FormData = require("form-data");

const app = express();
app.use(express.json());
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
   🔹 ML PREDICTION ROUTE
   Forwards image to Python Flask server
=========================== */
app.post("/predict", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const form = new FormData();
    form.append("image", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const response = await fetch("http://localhost:5001/predict", {
      method: "POST",
      body: form,
    });

    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error("❌ Prediction error:", err.message);
    res
      .status(500)
      .json({
        error: "Prediction failed. Is Python server running on port 5001?",
      });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
