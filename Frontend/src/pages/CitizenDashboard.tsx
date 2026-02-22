import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ImageCaptureModal from "../components/report/ImageCaptureModal";
import type { LocationData } from "../hooks/useLocation";
import { supabase } from "../lib/supabaseClient";

interface Sighting {
  id: string;
  image_url: string;
  latitude: number;
  longitude: number;
  species_name: string | null;
  confidence_score: number | null;
  satellite_verified: boolean;
  status: string;
  category: string | null;
  created_at: string;
}

export default function CitizenDashboard() {
  const { profile, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [sightingsLoading, setSightingsLoading] = useState(true);

  async function fetchSightings() {
    if (!session?.user?.id) return;
    setSightingsLoading(true);
    const { data, error } = await supabase
      .from("sightings")
      .select(
        "id, image_url, latitude, longitude, species_name, confidence_score, satellite_verified, status, category, created_at",
      )
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setSightings(data as Sighting[]);
    setSightingsLoading(false);
  }

  useEffect(() => {
    fetchSightings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSightingSubmit(
    image: File,
    location: LocationData,
    category: string,
  ) {
    if (!session?.user?.id) return;
    setSubmitting(true);
    setShowModal(false);

    try {
      // ── Step 1: Upload image to Supabase Storage ───────────────
      const ext = image.name.split(".").pop();
      const filePath = `${session.user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("sighting-images")
        .upload(filePath, image, { upsert: false });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: urlData } = supabase.storage
        .from("sighting-images")
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;

      // ── Step 2: Insert pending sighting record ─────────────────
      const { data: sighting, error: insertError } = await supabase
        .from("sightings")
        .insert({
          user_id: session.user.id,
          image_url: imageUrl,
          latitude: location.lat,
          longitude: location.lng,
          location_source: location.source,
          category,
          status: "pending",
        })
        .select()
        .single();

      if (insertError)
        throw new Error(`DB insert failed: ${insertError.message}`);
      console.log("[EcoSentry] Sighting created:", sighting);

      // ── Step 3: Call backend AI ──────────────────────────────────
      const backendUrl = import.meta.env.VITE_BACKEND_URL as string;
      const formData = new FormData();
      formData.append("image", image);

      const aiRes = await fetch(`${backendUrl}/predict`, {
        method: "POST",
        body: formData,
      });

      if (!aiRes.ok) throw new Error("Plant identification request failed");

      const aiJson = (await aiRes.json()) as {
        species: string;
        scientificName: string;
        commonNames: string[];
        family: string;
        confidence: number;
        invasive: boolean;
        invasiveInfo: {
          commonName: string;
          severity: string;
          region: string;
          description: string;
          note?: string;
        } | null;
        topResults: {
          scientificName: string;
          commonNames: string[];
          family: string;
          score: number;
          invasive: boolean;
        }[];
      };

      console.log("[EcoSentry] Plant ID result:", aiJson);

      // ── Step 4: Update sighting with AI result ───────────────────
      const { error: aiUpdateError } = await supabase
        .from("sightings")
        .update({
          species_name: aiJson.species,
          confidence_score: aiJson.confidence,
          ai_raw_response: aiJson,
        })
        .eq("id", sighting.id);

      if (aiUpdateError)
        throw new Error(`AI update failed: ${aiUpdateError.message}`);

      // If plant is not invasive, skip satellite verification and clustering
      if (!aiJson.invasive) {
        await supabase
          .from("sightings")
          .update({ status: "not_invasive" })
          .eq("id", sighting.id);

        showToast(
          `🌿 ${aiJson.species} identified (${(aiJson.confidence * 100).toFixed(1)}% confidence) — Not an invasive species.`,
          true,
        );
        return;
      }

      // Plant IS invasive — continue with satellite verification

      // ── Step 5: Call satellite verification ──────────────────────
      const satRes = await fetch(`${backendUrl}/satellite-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.lng,
          radius: 500, // 500 m buffer around the sighting
        }),
      });

      const satJson = (await satRes.json()) as {
        ndvi_change: number | null;
        anomaly: boolean;
        severity: string;
        message: string;
      };

      console.log("[EcoSentry] Satellite result:", satJson);

      // ── Step 6: Insert satellite_verifications row ────────────────
      const { error: satInsertError } = await supabase
        .from("satellite_verifications")
        .insert({
          sighting_id: sighting.id,
          plant_name: aiJson.species,
          latitude: location.lat,
          longitude: location.lng,
          verified: satJson.anomaly,
          confidence:
            satJson.ndvi_change !== null
              ? Math.min(Math.abs(satJson.ndvi_change), 1)
              : null,
          satellite_response: satJson,
        });

      if (satInsertError)
        throw new Error(`Satellite insert failed: ${satInsertError.message}`);

      // ── Step 7: Update sighting with satellite result ────────────
      // Plant is confirmed invasive by Pl@ntNet — always mark as "verified"
      // Satellite anomaly is additional evidence, not a gate
      const newStatus = satJson.anomaly ? "verified" : "verified";

      const { error: satUpdateError } = await supabase
        .from("sightings")
        .update({
          satellite_verified: satJson.anomaly,
          status: newStatus,
        })
        .eq("id", sighting.id);

      if (satUpdateError)
        throw new Error(
          `Satellite status update failed: ${satUpdateError.message}`,
        );

      const statusLabel = satJson.anomaly
        ? `✅ Verified — ${aiJson.species} (INVASIVE, ${aiJson.invasiveInfo?.severity ?? "unknown"} severity) + satellite anomaly detected`
        : `✅ Verified — ${aiJson.species} (INVASIVE, ${aiJson.invasiveInfo?.severity ?? "unknown"} severity). Satellite: normal vegetation.`;

      // ── Step 8: Clustering + escalation (all invasive sightings) ──
      {
        const clusterRes = await fetch(`${backendUrl}/handle-cluster`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sighting_id: sighting.id,
            species_name: aiJson.species,
            latitude: location.lat,
            longitude: location.lng,
          }),
        });

        const clusterJson = (await clusterRes.json()) as {
          cluster_id: string;
          sighting_count: number;
          escalated: boolean;
        };

        console.log("[EcoSentry] Cluster result:", clusterJson);

        // If backend escalated the cluster, update the sighting status to match
        if (clusterJson.escalated) {
          await supabase
            .from("sightings")
            .update({ status: "escalated" })
            .eq("id", sighting.id);

          showToast(
            `🚨 Escalated! ${aiJson.species} cluster has ${clusterJson.sighting_count} sightings — authorities notified.`,
            false,
          );
        } else {
          showToast(
            `${statusLabel} — cluster #${clusterJson.sighting_count}`,
            true,
          );
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      console.error("[EcoSentry]", msg);
      showToast(msg, false);
    } finally {
      setSubmitting(false);
      fetchSightings(); // refresh list after every submission
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-[#060d06] text-white">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toast.ok
              ? "bg-green-500/20 border border-green-500/40 text-green-300"
              : "bg-red-500/20 border border-red-500/40 text-red-300"
          }`}
        >
          {toast.ok ? "✅ " : "❌ "}
          {toast.msg}
        </div>
      )}

      {/* Submitting overlay */}
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <span className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-sm">
              Uploading &amp; analysing sighting...
            </p>
          </div>
        </div>
      )}

      {showModal && (
        <ImageCaptureModal
          onClose={() => setShowModal(false)}
          onSubmit={handleSightingSubmit}
        />
      )}
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-white/5 bg-[#060d06]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span className="text-white font-semibold text-sm tracking-wide">
            EcoSentry
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-[#111811] border border-white/10 rounded-full px-3 py-1.5">
            <svg
              className="w-4 h-4 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-gray-300 text-sm truncate max-w-[120px]">
              {profile?.full_name ?? "Citizen"}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="p-2 rounded-lg text-green-400 hover:text-green-300 hover:bg-green-500/10 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Welcome */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-white">
              Hello, {profile?.full_name?.split(" ")[0] ?? "Citizen"}
            </h1>
          </div>
          <p className="text-gray-400">
            Report invasive species and track your submissions.
          </p>
        </div>

        {/* Report button */}
        <div className="bg-[#0d150d] border border-white/10 rounded-2xl p-5 md:p-8 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 hover:border-green-500/40 transition-all duration-300 group">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-700/20 border border-green-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg
                className="w-6 h-6 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">
                Spotted something?
              </h2>
              <p className="text-gray-400 text-sm">
                Upload an image of a suspected invasive species with your
                location.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={submitting}
            className="w-full md:w-auto bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold px-6 py-3 rounded-full transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Report a Sighting
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-5 mb-8">
          {[
            {
              label: "My Reports",
              value: sightings.length,
              desc: "Total sightings you have reported so far.",
            },
            {
              label: "Not Invasive",
              value: sightings.filter((s) => s.status === "not_invasive")
                .length,
              desc: "Plants identified as non-invasive species.",
            },
            {
              label: "Verified",
              value: sightings.filter((s) => s.status === "verified").length,
              desc: "Sightings confirmed through satellite analysis.",
            },
            {
              label: "Cleaned",
              value: sightings.filter((s) => s.status === "cleaned").length,
              desc: "Reported areas that have been cleaned up.",
            },
          ].map(({ label, value, desc }) => (
            <div
              key={label}
              className="bg-[#0d150d] border border-white/10 rounded-xl p-5"
            >
              <p className="text-6xl font-bold text-white tracking-tight mb-2">
                {sightingsLoading ? "—" : value}
              </p>
              <p className="text-sm font-semibold text-green-400">{label}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* Past sightings */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-base">My Sightings</h3>

          {sightingsLoading ? (
            <div className="flex justify-center py-12">
              <span className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sightings.length === 0 ? (
            <div className="bg-[#0d150d] border border-white/10 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-green-500/20 to-green-700/20 border border-green-500/30 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-white font-semibold mb-2">
                No sightings reported yet
              </p>
              <p className="text-gray-400 text-sm">
                Use the button above to make your first report.
              </p>
            </div>
          ) : (
            sightings.map((s) => {
              const statusConfig: Record<
                string,
                { label: string; color: string }
              > = {
                pending: {
                  label: "Pending",
                  color:
                    "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
                },
                not_invasive: {
                  label: "Not Invasive",
                  color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                },
                verified: {
                  label: "Verified",
                  color: "text-green-400  bg-green-500/10  border-green-500/20",
                },
                escalated: {
                  label: "Escalated",
                  color: "text-red-400    bg-red-500/10    border-red-500/20",
                },
                rejected: {
                  label: "Rejected",
                  color: "text-gray-400  bg-white/5       border-white/10",
                },
                cleaned: {
                  label: "Cleaned",
                  color:
                    "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                },
              };
              const { label: statusLabel, color: statusColor } =
                statusConfig[s.status] ?? statusConfig.pending;
              const date = new Date(s.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={s.id}
                  className="bg-[#0d150d] border border-white/10 rounded-xl p-4 flex gap-4 items-start hover:border-green-500/30 transition-colors"
                >
                  {/* Thumbnail */}
                  <img
                    src={s.image_url}
                    alt={s.species_name ?? "sighting"}
                    className="w-16 h-16 object-cover rounded-lg border border-white/10 flex-shrink-0"
                  />
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="text-white font-medium text-sm truncate">
                        {s.species_name ?? "Identifying..."}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${statusColor}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                      📍 {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {s.confidence_score !== null && (
                        <span className="text-gray-400 text-xs">
                          AI {(s.confidence_score * 100).toFixed(1)}% confidence
                        </span>
                      )}
                      {s.category && (
                        <span className="text-gray-400 text-xs capitalize bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                          {s.category}
                        </span>
                      )}
                      <span className="text-gray-600 text-xs">{date}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
