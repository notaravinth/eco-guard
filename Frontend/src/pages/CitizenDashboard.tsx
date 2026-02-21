import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ImageCaptureModal from "../components/report/ImageCaptureModal";
import type { LocationData } from "../hooks/useLocation";

export default function CitizenDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  function handleSightingSubmit(image: File, location: LocationData) {
    // TODO: upload image to Supabase Storage + save sighting to DB
    console.log("Sighting submitted:", { image, location });
    setShowModal(false);
  }

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-[#060d06] text-white">
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
            EcoGuard
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
            className="text-gray-400 hover:text-white text-sm transition-colors whitespace-nowrap"
          >
            Sign Out
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
            className="w-full md:w-auto bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-3 rounded-full transition-colors flex items-center justify-center gap-2"
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
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
          {[
            { label: "My Reports", value: "0" },
            { label: "Verified", value: "0" },
            { label: "Escalated", value: "0" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-[#0d150d] border border-white/10 rounded-xl p-3 md:p-4 text-center"
            >
              <p className="text-xl md:text-2xl font-bold text-green-400">
                {value}
              </p>
              <p className="text-gray-500 text-xs md:text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Past sightings placeholder */}
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
      </div>
    </div>
  );
}
