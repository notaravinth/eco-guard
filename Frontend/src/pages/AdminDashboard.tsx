import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type SightingStatus =
  | "pending"
  | "verified"
  | "escalated"
  | "rejected"
  | "not_invasive"
  | "cleaned";

interface Sighting {
  id: string;
  image_url: string;
  latitude: number;
  longitude: number;
  species_name: string | null;
  confidence_score: number | null;
  satellite_verified: boolean;
  status: SightingStatus;
  category: string | null;
  created_at: string;
  profiles: { full_name: string } | null;
}

interface Cluster {
  id: string;
  species_name: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  sighting_count: number;
  status: string;
  escalated_at: string | null;
  created_at: string;
}

interface SatVerification {
  id: string;
  sighting_id: string;
  plant_name: string;
  latitude: number;
  longitude: number;
  verified: boolean | null;
  confidence: number | null;
  checked_at: string;
  satellite_response: Record<string, unknown> | null;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
  sighting_count: number;
}

type Tab = "sightings" | "clusters" | "satellite" | "users";

const STATUS_CONFIG: Record<SightingStatus, { label: string; color: string }> =
  {
    pending: {
      label: "Pending",
      color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
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
    not_invasive: {
      label: "Not Invasive",
      color: "text-blue-400  bg-blue-500/10   border-blue-500/20",
    },
    cleaned: {
      label: "Cleaned",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
  };

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("sightings");
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [satVerifications, setSatVerifications] = useState<SatVerification[]>(
    [],
  );
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [expandedSatId, setExpandedSatId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SightingStatus | "all">(
    "all",
  );
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(
    null,
  );
  const [clusterSightings, setClusterSightings] = useState<Sighting[]>([]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function fetchAll() {
    setLoading(true);
    const [
      { data: sData },
      { data: cData },
      { data: svData },
      { data: uData },
    ] = await Promise.all([
      supabase
        .from("sightings")
        .select(
          "id, image_url, latitude, longitude, species_name, confidence_score, satellite_verified, status, category, created_at, profiles(full_name)",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("clusters")
        .select("*")
        .order("updated_at", { ascending: false }),
      supabase
        .from("satellite_verifications")
        .select(
          "id, sighting_id, plant_name, latitude, longitude, verified, confidence, checked_at, satellite_response",
        )
        .order("checked_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, full_name, role, created_at")
        .order("created_at", { ascending: false }),
    ]);
    if (sData) setSightings(sData as unknown as Sighting[]);
    if (cData) setClusters(cData as Cluster[]);
    if (svData) setSatVerifications(svData as SatVerification[]);
    if (uData) {
      // attach sighting count to each user
      const counts: Record<string, number> = {};
      if (sData) {
        (sData as unknown as Sighting[]).forEach((s) => {
          const uid = (s as unknown as { user_id: string }).user_id;
          counts[uid] = (counts[uid] ?? 0) + 1;
        });
      }
      setUsers(
        (
          uData as {
            id: string;
            full_name: string | null;
            role: string;
            created_at: string;
          }[]
        ).map((u) => ({
          ...u,
          sighting_count: counts[u.id] ?? 0,
        })),
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, []);

  async function updateSightingStatus(id: string, newStatus: SightingStatus) {
    setActionLoading(id);
    const { error } = await supabase
      .from("sightings")
      .update({ status: newStatus })
      .eq("id", id);
    if (error) {
      showToast(`Failed: ${error.message}`, false);
    } else {
      setSightings((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)),
      );
      showToast(`Sighting marked as ${newStatus}`, true);
    }
    setActionLoading(null);
  }

  async function toggleClusterMap(clusterId: string) {
    if (expandedClusterId === clusterId) {
      setExpandedClusterId(null);
      setClusterSightings([]);
      return;
    }
    setExpandedClusterId(clusterId);
    const { data } = await supabase
      .from("sightings")
      .select(
        "id, image_url, latitude, longitude, species_name, confidence_score, satellite_verified, status, category, created_at, profiles(full_name)",
      )
      .eq("cluster_id", clusterId)
      .order("created_at", { ascending: false });
    if (data) setClusterSightings(data as unknown as Sighting[]);
  }

  async function updateClusterStatus(id: string, newStatus: string) {
    setActionLoading(id);
    const { error } = await supabase
      .from("clusters")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      showToast(`Failed: ${error.message}`, false);
    } else {
      setClusters((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
      );
      // Also update all sightings in this cluster
      await supabase
        .from("sightings")
        .update({ status: newStatus })
        .eq("cluster_id", id);
      showToast(`Cluster marked as ${newStatus}`, true);
    }
    setActionLoading(null);
  }

  const filteredSightings =
    statusFilter === "all"
      ? sightings
      : sightings.filter((s) => s.status === statusFilter);

  const stats = {
    total: sightings.length,
    verified: sightings.filter((s) => s.status === "verified").length,
    escalated: sightings.filter((s) => s.status === "escalated").length,
    clusters: clusters.filter((c) => c.status === "active").length,
    users: users.filter((u) => u.role === "citizen").length,
  };

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
          {toast.msg}
        </div>
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
          <span className="bg-green-500/20 text-green-400 text-xs font-medium px-2 py-0.5 rounded-full ml-1 border border-green-500/20">
            Admin
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
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span className="text-gray-300 text-sm truncate max-w-[120px]">
              {profile?.full_name ?? "Admin"}
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

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-1">
            Admin Dashboard
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-5 mb-8">
          {[
            {
              label: "Total Sightings",
              value: stats.total,
              desc: "All reported invasive plant sightings across regions.",
            },
            {
              label: "Verified",
              value: stats.verified,
              desc: "Sightings confirmed through satellite analysis.",
            },
            {
              label: "Escalated",
              value: stats.escalated,
              desc: "High-density clusters flagged for immediate action.",
            },
            {
              label: "Active Clusters",
              value: stats.clusters,
              desc: "Geographically grouped sighting zones currently active.",
            },
            {
              label: "Citizens",
              value: stats.users,
              desc: "Registered citizens contributing field reports.",
            },
          ].map(({ label, value, desc }) => (
            <div
              key={label}
              className="bg-[#0d150d] border border-white/10 rounded-xl p-5"
            >
              <p className="text-6xl font-bold text-white tracking-tight mb-2">
                {loading ? "—" : value}
              </p>
              <p className="text-sm font-semibold text-green-400">{label}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-[#0d150d] border border-white/10 rounded-xl p-1 mb-6 w-fit">
          {(["sightings", "clusters", "satellite", "users"] as Tab[]).map(
            (t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t
                    ? "bg-green-500 text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {t === "sightings" ? (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Sightings
                  </>
                ) : t === "clusters" ? (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                    Clusters
                  </>
                ) : t === "satellite" ? (
                  <>
                    <svg
                      className="w-4 h-4"
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
                    Satellite
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Users
                  </>
                )}
              </button>
            ),
          )}
        </div>

        {/* ── SIGHTINGS TAB ── */}
        {tab === "sightings" && (
          <div>
            {/* Status filter pills */}
            <div className="flex flex-wrap gap-2 mb-5">
              {(
                [
                  "all",
                  "pending",
                  "verified",
                  "escalated",
                  "cleaned",
                  "not_invasive",
                  "rejected",
                ] as const
              ).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
                    statusFilter === f
                      ? "bg-green-500 text-black border-green-500"
                      : "text-gray-400 border-white/10 hover:border-green-500/40"
                  }`}
                >
                  {f === "all" ? "All" : STATUS_CONFIG[f].label}
                  {f !== "all" && (
                    <span className="ml-1.5 opacity-60">
                      {sightings.filter((s) => s.status === f).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <span className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredSightings.length === 0 ? (
              <div className="bg-[#0d150d] border border-white/10 rounded-2xl p-12 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
                  <svg
                    className="w-7 h-7 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <p className="text-white font-semibold mb-1">
                  No sightings found
                </p>
                <p className="text-gray-500 text-sm">Try a different filter.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSightings.map((s) => {
                  const { label: statusLabel, color: statusColor } =
                    STATUS_CONFIG[s.status] ?? STATUS_CONFIG.pending;
                  const date = new Date(s.created_at).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  );
                  return (
                    <div
                      key={s.id}
                      className="bg-[#0d150d] border border-white/10 rounded-xl p-4 hover:border-green-500/30 transition-colors"
                    >
                      <div className="flex gap-4 items-start">
                        {/* Thumbnail */}
                        <img
                          src={s.image_url}
                          alt={s.species_name ?? "sighting"}
                          className="w-16 h-16 object-cover rounded-xl border border-white/10 flex-shrink-0"
                        />
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                            <p className="text-white font-semibold text-sm">
                              {s.species_name ?? "Identifying..."}
                            </p>
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full border font-medium flex-shrink-0 ${statusColor}`}
                            >
                              {statusLabel}
                            </span>
                          </div>

                          <div className="flex flex-col gap-1">
                            {/* Reporter */}
                            <div className="flex items-center gap-1.5">
                              <svg
                                className="w-3.5 h-3.5 text-gray-500 flex-shrink-0"
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
                              <span className="text-gray-400 text-xs">
                                {s.profiles?.full_name ?? "Unknown user"}
                              </span>
                            </div>
                            {/* Coordinates */}
                            <div className="flex items-center gap-1.5">
                              <svg
                                className="w-3.5 h-3.5 text-gray-500 flex-shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span className="text-gray-400 text-xs">
                                {s.latitude.toFixed(4)},{" "}
                                {s.longitude.toFixed(4)}
                              </span>
                            </div>
                          </div>

                          {/* Meta row */}
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            {s.category && (
                              <span className="text-gray-400 text-xs capitalize bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                                {s.category}
                              </span>
                            )}
                            {s.confidence_score !== null && (
                              <div className="flex items-center gap-1">
                                <svg
                                  className="w-3.5 h-3.5 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                  />
                                </svg>
                                <span className="text-gray-500 text-xs">
                                  AI {(s.confidence_score * 100).toFixed(1)}%
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <div
                                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.satellite_verified ? "bg-green-400" : "bg-gray-600"}`}
                              />
                              <span className="text-gray-500 text-xs">
                                Satellite{" "}
                                {s.satellite_verified
                                  ? "verified"
                                  : "unverified"}
                              </span>
                            </div>
                            <span className="text-gray-600 text-xs ml-auto">
                              {date}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Admin actions */}
                      {(s.status === "pending" || s.status === "escalated") && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                          <button
                            onClick={() =>
                              updateSightingStatus(s.id, "verified")
                            }
                            disabled={actionLoading === s.id}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs font-medium py-2 rounded-lg transition-colors disabled:opacity-40"
                          >
                            {actionLoading === s.id ? (
                              <span className="w-3.5 h-3.5 border border-green-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                            Verify
                          </button>
                          <button
                            onClick={() =>
                              updateSightingStatus(s.id, "rejected")
                            }
                            disabled={actionLoading === s.id}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium py-2 rounded-lg transition-colors disabled:opacity-40"
                          >
                            {actionLoading === s.id ? (
                              <span className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            )}
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── CLUSTERS TAB ── */}
        {tab === "clusters" && (
          <div>
            {loading ? (
              <div className="flex justify-center py-16">
                <span className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : clusters.length === 0 ? (
              <div className="bg-[#0d150d] border border-white/10 rounded-2xl p-12 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
                  <svg
                    className="w-7 h-7 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                </div>
                <p className="text-white font-semibold mb-1">No clusters yet</p>
                <p className="text-gray-500 text-sm">
                  Clusters form automatically when multiple verified sightings
                  appear in the same area.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {clusters.map((c) => {
                  const isEscalated = c.status === "escalated";
                  const isCleaned = c.status === "cleaned";

                  const clusterStatusConfig: Record<
                    string,
                    { label: string; color: string }
                  > = {
                    active: {
                      label: "Active",
                      color:
                        "text-green-400 bg-green-500/10 border-green-500/20",
                    },
                    escalated: {
                      label: "Escalated",
                      color: "text-red-400 bg-red-500/10 border-red-500/20",
                    },
                    cleaned: {
                      label: "Cleaned",
                      color:
                        "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                    },
                  };
                  const cStatus =
                    clusterStatusConfig[c.status] ?? clusterStatusConfig.active;
                  return (
                    <div
                      key={c.id}
                      className={`bg-[#0d150d] border rounded-xl p-5 transition-colors ${
                        isEscalated
                          ? "border-red-500/30"
                          : isCleaned
                            ? "border-white/5 opacity-80"
                            : "border-white/10 hover:border-green-500/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                            <p className="text-white font-semibold text-sm">
                              {c.species_name}
                            </p>
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${cStatus.color}`}
                            >
                              {cStatus.label}
                            </span>
                          </div>

                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <svg
                                className="w-3.5 h-3.5 text-gray-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span className="text-gray-400 text-xs">
                                {c.center_lat.toFixed(4)},{" "}
                                {c.center_lng.toFixed(4)}
                              </span>
                              <span className="text-gray-600 text-xs">·</span>
                              <span className="text-gray-400 text-xs">
                                {c.radius_km} km radius
                              </span>
                            </div>

                            {c.escalated_at && (
                              <div className="flex items-center gap-1.5">
                                <svg
                                  className="w-3.5 h-3.5 text-red-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span className="text-red-400 text-xs">
                                  Escalated{" "}
                                  {new Date(c.escalated_at).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </span>
                              </div>
                            )}

                            {isCleaned && (
                              <div className="flex items-center gap-1.5">
                                <svg
                                  className="w-3.5 h-3.5 text-emerald-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span className="text-emerald-400 text-xs">
                                  This cluster has been cleaned up by an admin.
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Sighting count badge */}
                        <div
                          className={`flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center border ${
                            isEscalated
                              ? "bg-red-500/10 border-red-500/20"
                              : isCleaned
                                ? "bg-emerald-500/10 border-emerald-500/20"
                                : "bg-green-500/10 border-green-500/20"
                          }`}
                        >
                          <p
                            className={`text-2xl font-bold leading-none ${
                              isEscalated
                                ? "text-red-400"
                                : isCleaned
                                  ? "text-emerald-400"
                                  : "text-green-400"
                            }`}
                          >
                            {c.sighting_count}
                          </p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            reports
                          </p>
                        </div>
                      </div>

                      {/* Action button for escalated clusters */}
                      {isEscalated && (
                        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                          <button
                            onClick={() => updateClusterStatus(c.id, "cleaned")}
                            disabled={actionLoading === c.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border transition-colors bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Mark Cleaned
                          </button>
                          {actionLoading === c.id && (
                            <span className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin self-center" />
                          )}
                        </div>
                      )}

                      {/* View Map toggle */}
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <button
                          onClick={() => toggleClusterMap(c.id)}
                          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-400 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                            />
                          </svg>
                          {expandedClusterId === c.id ? "Hide Map" : "View Map"}
                          <svg
                            className={`w-3 h-3 transition-transform ${expandedClusterId === c.id ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Expanded Map */}
                      {expandedClusterId === c.id && (
                        <div
                          className="mt-3 rounded-xl overflow-hidden border border-white/10"
                          style={{ height: 350 }}
                        >
                          <MapContainer
                            center={[c.center_lat, c.center_lng]}
                            zoom={13}
                            style={{ height: "100%", width: "100%" }}
                            scrollWheelZoom={true}
                          >
                            <TileLayer
                              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                              attribution="&copy; Esri"
                            />
                            <Circle
                              center={[c.center_lat, c.center_lng]}
                              radius={c.radius_km * 1000}
                              pathOptions={{
                                color: isEscalated
                                  ? "#ef4444"
                                  : isCleaned
                                    ? "#10b981"
                                    : "#22c55e",
                                fillColor: isEscalated
                                  ? "#ef4444"
                                  : isCleaned
                                    ? "#10b981"
                                    : "#22c55e",
                                fillOpacity: 0.1,
                                weight: 2,
                              }}
                            />
                            {clusterSightings.map((s) => (
                              <Marker
                                key={s.id}
                                position={[s.latitude, s.longitude]}
                                icon={L.divIcon({
                                  className: "",
                                  html: `<div style="width:12px;height:12px;border-radius:50%;background:${s.status === "cleaned" ? "#10b981" : "#ef4444"};border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.5);"></div>`,
                                  iconSize: [12, 12],
                                  iconAnchor: [6, 6],
                                })}
                              >
                                <Popup>
                                  <div style={{ minWidth: 160 }}>
                                    <img
                                      src={s.image_url}
                                      alt=""
                                      style={{
                                        width: "100%",
                                        height: 80,
                                        objectFit: "cover",
                                        borderRadius: 6,
                                        marginBottom: 6,
                                      }}
                                    />
                                    <strong style={{ fontSize: 12 }}>
                                      {s.species_name}
                                    </strong>
                                    <br />
                                    <span
                                      style={{ fontSize: 11, color: "#666" }}
                                    >
                                      {s.latitude.toFixed(4)},{" "}
                                      {s.longitude.toFixed(4)}
                                    </span>
                                    <br />
                                    <span
                                      style={{ fontSize: 11, color: "#666" }}
                                    >
                                      {new Date(
                                        s.created_at,
                                      ).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </span>
                                    <br />
                                    <span
                                      style={{
                                        fontSize: 10,
                                        padding: "2px 6px",
                                        borderRadius: 8,
                                        background:
                                          s.status === "cleaned"
                                            ? "#d1fae5"
                                            : s.status === "escalated"
                                              ? "#fee2e2"
                                              : "#dcfce7",
                                        color:
                                          s.status === "cleaned"
                                            ? "#065f46"
                                            : s.status === "escalated"
                                              ? "#991b1b"
                                              : "#166534",
                                      }}
                                    >
                                      {s.status}
                                    </span>
                                  </div>
                                </Popup>
                              </Marker>
                            ))}
                          </MapContainer>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SATELLITE TAB ── */}
        {tab === "satellite" && (
          <div>
            {satVerifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
                  <svg
                    className="w-7 h-7 text-green-500"
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
                <p className="text-white font-semibold mb-1">
                  No satellite verifications yet
                </p>
                <p className="text-gray-500 text-sm">
                  Satellite checks run automatically when sightings are
                  submitted.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {satVerifications.map((sv) => {
                  const isVerified = sv.verified === true;
                  const isFailed = sv.verified === false;
                  const ndvi = sv.satellite_response
                    ? ((sv.satellite_response as Record<string, unknown>)
                        .ndvi_change ?? null)
                    : null;
                  return (
                    <div
                      key={sv.id}
                      className="bg-[#0d150d] border border-white/10 rounded-xl p-5 hover:border-green-500/30 transition-colors cursor-pointer"
                      onClick={() =>
                        setExpandedSatId(expandedSatId === sv.id ? null : sv.id)
                      }
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                            <p className="text-white font-semibold text-sm">
                              {sv.plant_name}
                            </p>
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                                isVerified
                                  ? "text-green-400 bg-green-500/10 border-green-500/20"
                                  : isFailed
                                    ? "text-red-400 bg-red-500/10 border-red-500/20"
                                    : "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
                              }`}
                            >
                              {isVerified
                                ? "Pass"
                                : isFailed
                                  ? "Fail"
                                  : "Pending"}
                            </span>
                            {sv.confidence !== null && (
                              <span className="text-xs text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                                {(sv.confidence * 100).toFixed(1)}% conf.
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <svg
                                className="w-3.5 h-3.5 text-gray-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              {sv.latitude.toFixed(4)},{" "}
                              {sv.longitude.toFixed(4)}
                            </span>
                            {ndvi !== null && (
                              <span className="flex items-center gap-1">
                                <svg
                                  className="w-3.5 h-3.5 text-gray-500"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                  />
                                </svg>
                                NDVI Δ {String(ndvi)}
                              </span>
                            )}
                            {sv.checked_at && (
                              <span>
                                {new Date(sv.checked_at).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                            )}
                            <span className="ml-auto text-gray-600">
                              {expandedSatId === sv.id ? "▲ Hide" : "▼ Details"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ── Expanded detail panel ── */}
                      {expandedSatId === sv.id &&
                        sv.satellite_response &&
                        (() => {
                          const resp = sv.satellite_response as Record<
                            string,
                            unknown
                          >;
                          const ndviChange = resp.ndvi_change as number | null;
                          const anomaly = resp.anomaly as boolean | undefined;
                          const severity = resp.severity as string | undefined;
                          const message = resp.message as string | undefined;

                          const severityColor =
                            severity === "HIGH"
                              ? "text-red-400 bg-red-500/10 border-red-500/20"
                              : severity === "MEDIUM"
                                ? "text-orange-400 bg-orange-500/10 border-orange-500/20"
                                : severity === "LOW"
                                  ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
                                  : "text-gray-400 bg-white/5 border-white/10";

                          return (
                            <div
                              className="mt-4 pt-4 border-t border-white/10 space-y-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Message banner */}
                              {message && (
                                <div
                                  className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
                                    anomaly
                                      ? "bg-red-500/10 border border-red-500/20 text-red-300"
                                      : "bg-green-500/10 border border-green-500/20 text-green-300"
                                  }`}
                                >
                                  {message}
                                </div>
                              )}

                              {/* Detail grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {/* NDVI Change */}
                                <div className="bg-[#111811] border border-white/10 rounded-lg px-3 py-2.5 text-center">
                                  <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                                    NDVI Change
                                  </p>
                                  <p
                                    className={`text-lg font-bold ${
                                      ndviChange !== null &&
                                      ndviChange !== undefined &&
                                      ndviChange < -0.05
                                        ? "text-red-400"
                                        : ndviChange !== null &&
                                            ndviChange !== undefined &&
                                            ndviChange < 0
                                          ? "text-yellow-400"
                                          : "text-green-400"
                                    }`}
                                  >
                                    {ndviChange !== null &&
                                    ndviChange !== undefined
                                      ? ndviChange.toFixed(4)
                                      : "N/A"}
                                  </p>
                                </div>

                                {/* Anomaly */}
                                <div className="bg-[#111811] border border-white/10 rounded-lg px-3 py-2.5 text-center">
                                  <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                                    Anomaly
                                  </p>
                                  <p
                                    className={`text-lg font-bold ${
                                      anomaly
                                        ? "text-red-400"
                                        : "text-green-400"
                                    }`}
                                  >
                                    {anomaly ? "🚨 Yes" : "✅ No"}
                                  </p>
                                </div>

                                {/* Severity */}
                                <div className="bg-[#111811] border border-white/10 rounded-lg px-3 py-2.5 text-center">
                                  <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                                    Severity
                                  </p>
                                  <span
                                    className={`inline-block text-xs px-3 py-1 rounded-full border font-semibold mt-0.5 ${severityColor}`}
                                  >
                                    {severity ?? "NONE"}
                                  </span>
                                </div>

                                {/* Confidence */}
                                <div className="bg-[#111811] border border-white/10 rounded-lg px-3 py-2.5 text-center">
                                  <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                                    Confidence
                                  </p>
                                  <p className="text-lg font-bold text-white">
                                    {sv.confidence !== null
                                      ? `${(sv.confidence * 100).toFixed(1)}%`
                                      : "N/A"}
                                  </p>
                                </div>
                              </div>

                              {/* Coordinates + Sighting ID */}
                              <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-1">
                                <span>
                                  📍 {sv.latitude.toFixed(6)},{" "}
                                  {sv.longitude.toFixed(6)}
                                </span>
                                <span>
                                  🆔 Sighting: {sv.sighting_id.slice(0, 8)}...
                                </span>
                                {sv.checked_at && (
                                  <span>
                                    🕐{" "}
                                    {new Date(sv.checked_at).toLocaleString(
                                      "en-IN",
                                      {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <div>
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
                  <svg
                    className="w-7 h-7 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <p className="text-white font-semibold mb-1">No users yet</p>
                <p className="text-gray-500 text-sm">
                  Registered citizens will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="bg-[#0d150d] border border-white/10 rounded-xl p-5 hover:border-green-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-5 h-5 text-green-400"
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
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-semibold text-sm truncate">
                            {u.full_name || "Unknown"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${
                                u.role === "admin"
                                  ? "text-purple-400 bg-purple-500/10 border-purple-500/20"
                                  : "text-green-400 bg-green-500/10 border-green-500/20"
                              }`}
                            >
                              {u.role}
                            </span>
                            {u.created_at && (
                              <span className="text-gray-500 text-xs">
                                Joined{" "}
                                {new Date(u.created_at).toLocaleDateString(
                                  "en-IN",
                                  { month: "short", year: "numeric" },
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-2xl font-bold text-white">
                          {u.sighting_count}
                        </p>
                        <p className="text-gray-500 text-xs">sightings</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
