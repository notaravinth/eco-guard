import { useState, useEffect } from "react";
import "../App.css";
import { Link } from "react-router-dom";
import logoImg from "../assets/logo.jpeg";
import lantanaCamaraImg from "../assets/lantana-camara.jpeg";
import partheniumImg from "../assets/Parthenium.jpeg";
import prosopisJulifloraImg from "../assets/Prosopis Juliflora.jpeg";
import mapClusterImg from "../assets/map cluster.jpeg";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#060d06] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav
        className={`fixed left-1/2 -translate-x-1/2 z-50 flex items-center justify-between backdrop-blur-md transition-[top,width,padding,border-radius,background-color,box-shadow,border-color] duration-700 delay-100 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
          scrolled
            ? "top-3 w-[calc(100%-2rem)] max-w-5xl px-4 md:px-6 py-3 rounded-2xl border border-white/10 bg-[#060d06]/95 shadow-xl shadow-black/50"
            : "top-0 w-full px-4 md:px-8 py-3 rounded-none border-b border-white/5 bg-[#060d06]/80 shadow-none"
        }`}
      >
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2 focus:outline-none"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <img
              src={logoImg}
              alt="EcoSentry"
              className="w-full h-full object-cover scale-150 origin-center"
            />
          </div>
          <span className="text-white font-semibold text-5sm tracking-wide">
            EcoSentry
          </span>
        </button>
        <div className="hidden md:flex items-center gap-1 bg-[#111811] border border-white/10 rounded-full px-2 py-1">
          <a
            href="#how"
            className="px-4 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
          >
            How it Works
          </a>
          <a
            href="#species"
            className="px-4 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Species
          </a>
          <a
            href="#community"
            className="px-4 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Community
          </a>
          <a
            href="#about"
            className="px-4 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
          >
            About
          </a>
        </div>
        <Link
          to="/login"
          className="bg-green-500 hover:bg-green-400 text-black font-semibold text-xs md:text-sm px-4 md:px-5 py-2 rounded-full transition-colors"
        >
          Sign In
        </Link>
      </nav>

      {/* Navbar spacer */}
      <div className="h-16" />

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center text-center bg-radial from-green-950 to-black pt-20 pb-20 px-4 overflow-hidden">
        <div className="glow-hero absolute inset-0 pointer-events-none" />

        <div className="border border-[#262527] bg-black rounded-full flex items-center justify-center px-3 py-2 gap-2 mx-auto max-w-max mb-8">
          <span className="rounded-full px-2 py-1 bg-green-500 text-[10px] font-bold text-black">
            NEW
          </span>
          <span className="text-base font-normal text-[#22c55e]">
            AI species detection just launched
          </span>
        </div>

        <h1 className="text-6xl md:text-8xl tracking-tight font-sans font-semibold text-white leading-tight mb-6">
          Protect Ecosystems <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-green-500">
            with Satellite Intelligence
          </span>
        </h1>

        <p className="text-white text-xl md:text-2xl max-w-3xl mb-10">
          Detect invasive species and monitor vegetation health using satellite
          NDVI analysis and deep learning models — all in one smart platform.
        </p>

        <Link
          to="/signup"
          className="bg-green-500 hover:bg-green-400 text-black font-semibold px-8 py-3 rounded-full transition-colors"
        >
          Report a Sighting
        </Link>
      </div>

      {/* How it Works */}
      <section
        id="how"
        className="relative z-10 px-4 md:px-8 py-14 md:py-24 max-w-6xl mx-auto"
      >
        <div className="text-center mb-14 -mt-15">
          <span className="text-green-500 text-sm font-semibold uppercase tracking-widest">
            Process
          </span>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-white mt-2">
            How EcoSentry Works
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto text-base md:text-lg">
            Four simple steps to protect ecosystems from invasive species —
            powered by AI and satellite data.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-6">
          {/* Card 1 - Large featured card */}
          <div className="md:col-span-4 bg-[#0d150d] border border-white/10 rounded-3xl p-8 md:p-10 hover:border-green-500/40 transition-all duration-300 group">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-700/20 border border-green-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
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
              <span className="text-xs font-mono text-green-500/60 bg-green-500/10 px-3 py-1 rounded-full">
                STEP 01
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-semibold text-white mb-3">
              Capture & Upload
            </h3>
            <p className="text-gray-400 text-base leading-relaxed mb-6">
              Take a photo using your device camera or upload an existing image
              of the plant you suspect is invasive. Our system supports multiple
              formats and automatically processes the image for optimal
              analysis.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#111811] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500">File Types</span>
                </div>
                <p className="text-sm text-white font-medium">JPG, PNG, HEIC</p>
              </div>
              <div className="bg-[#111811] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500">Max Size</span>
                </div>
                <p className="text-sm text-white font-medium">10MB per image</p>
              </div>
            </div>
          </div>

          {/* Card 2 - AI Recognition */}
          <div className="md:col-span-2 bg-[#0d150d] border border-white/10 rounded-3xl p-6 md:p-8 hover:border-green-500/40 transition-all duration-300 group flex flex-col">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-700/20 border border-green-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
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
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-xs font-mono text-green-500/60 bg-green-500/10 px-3 py-1 rounded-full">
                STEP 02
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-white mb-3">
              AI Recognition
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Our deep learning model analyzes the image and returns species
              identification with confidence metrics.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center flex-shrink-0 mt-1">
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-medium mb-1">
                    Instant Analysis
                  </p>
                  <p className="text-gray-500 text-xs">
                    Results in under 2 seconds
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center flex-shrink-0 mt-1">
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-medium mb-1">
                    96.8% Accuracy
                  </p>
                  <p className="text-gray-500 text-xs">
                    Validated by field experts
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 - Satellite NDVI Prediction */}
          <div className="md:col-span-2 bg-[#0d150d] border border-white/10 rounded-3xl p-6 md:p-8 hover:border-green-500/40 transition-all duration-300 group flex flex-col">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-700/20 border border-green-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
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
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-xs font-mono text-green-500/60 bg-green-500/10 px-3 py-1 rounded-full">
                STEP 03
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-white mb-3">
              Satellite NDVI Prediction
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Cross-verify sightings with real-time satellite vegetation health
              data using NDVI analysis.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center flex-shrink-0 mt-1">
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
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-medium mb-1">
                    2km Coverage Radius
                  </p>
                  <p className="text-gray-500 text-xs">Wide area monitoring</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center flex-shrink-0 mt-1">
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
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-medium mb-1">
                    10m Resolution
                  </p>
                  <p className="text-gray-500 text-xs">
                    High-precision imaging
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3"></div>
            </div>
          </div>

          {/* Card 4 - Verify & Alert */}
          <div className="md:col-span-4 bg-[#0d150d] border border-white/10 rounded-3xl p-6 md:p-8 hover:border-green-500/40 transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-700/20 border border-green-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <span className="text-xs font-mono text-green-500/60 bg-green-500/10 px-3 py-1 rounded-full">
                STEP 04
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-white mb-3">
              Verify & Alert
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Reports cluster in real-time across geographic zones. When
              detection threshold is reached, system automatically escalates
              alerts to relevant authorities and environmental departments.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#111811] rounded-xl p-4 text-center">
                <p className="text-xl md:text-2xl font-bold text-green-400">
                  14
                </p>
                <p className="text-xs text-gray-500 mt-1">Active Clusters</p>
              </div>
              <div className="bg-[#111811] rounded-xl p-4 text-center">
                <p className="text-xl md:text-2xl font-bold text-green-400">
                  3
                </p>
                <p className="text-xs text-gray-500 mt-1">Pending Alerts</p>
              </div>
              <div className="bg-[#111811] rounded-xl p-4 text-center">
                <p className="text-xl md:text-2xl font-bold text-green-400">
                  6
                </p>
                <p className="text-xs text-gray-500 mt-1">Escalated</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 px-4 md:px-8 py-14">
        <div className="max-w-5xl mx-auto border border-white/5 bg-[#0a110a] rounded-3xl px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
          {[
            { value: "2,400+", label: "Sightings Reported" },
            { value: "38", label: "Species Identified" },
            { value: "12", label: "Regions Monitored" },
            { value: "6", label: "Govt. Alerts Sent" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-bold text-green-400">{value}</p>
              <p className="text-gray-400 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Species */}
      <section
        id="species"
        className="relative z-10 px-4 md:px-8 py-14 md:py-24 max-w-5xl mx-auto"
      >
        <div className="text-center mb-14">
          <span className="text-green-500 text-sm font-semibold uppercase tracking-widest">
            Database
          </span>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-white mt-2">
            Tracked Invasive Species
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto text-base md:text-lg">
            Our model is trained to recognize the most damaging invasive plants
            threatening local ecosystems.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              name: "Lantana Camara",
              threat: "High",
              location: "Western Ghats",
              image: lantanaCamaraImg,
              isRealImage: true,
            },
            {
              name: "Parthenium",
              threat: "Critical",
              location: "Pan India",
              image: partheniumImg,
              isRealImage: true,
            },
            {
              name: "Prosopis Juliflora",
              threat: "High",
              location: "Arid Zones",
              image: prosopisJulifloraImg,
              isRealImage: true,
            },
          ].map(({ name, threat, location, image, isRealImage }) => (
            <div
              key={name}
              className="bg-[#0d150d] border border-white/10 rounded-2xl overflow-hidden hover:border-green-500/40 transition-all duration-300 group cursor-pointer"
            >
              {/* Image Area */}
              <div
                className={`relative h-48 flex items-center justify-center ${!isRealImage ? image : ""}`}
              >
                {isRealImage ? (
                  <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-16 h-16 text-green-400/40 group-hover:text-green-400/60 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                {/* Threat Badge */}
                <div className="absolute top-4 right-4">
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm ${
                      threat === "Critical"
                        ? "bg-red-500/90 text-white"
                        : threat === "High"
                          ? "bg-orange-500/90 text-white"
                          : "bg-yellow-500/90 text-black"
                    }`}
                  >
                    {threat}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-white text-lg font-semibold mb-2 group-hover:text-green-400 transition-colors">
                  {name}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
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
                  <span>{location}</span>
                </div>

                {/* Tags */}
                <div className="flex gap-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                    Invasive
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Tracked
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Community */}
      <section
        id="community"
        className="relative z-10 bg-[#0a110a] border-y border-white/5 px-4 md:px-8 py-14 md:py-24"
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <span className="text-green-500 text-sm font-semibold uppercase tracking-widest">
              Community
            </span>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white mt-2 mb-4">
              Citizens powering ecological defence
            </h2>
            <p className="text-gray-400 text-base leading-relaxed mb-6">
              Every sighting you report is cross-referenced with others nearby.
              When enough reports cluster in one area, our system automatically
              escalates the alert to the relevant government body.
            </p>
            <ul className="space-y-3">
              {[
                "Auto-GPS location tagging on every report",
                "Cluster detection across 1km radius zones",
                "Direct escalation to forest & environmental departments",
                "Real-time status updates on your submissions",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-gray-300"
                >
                  <svg
                    className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
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
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 bg-[#0d150d] border border-white/10 rounded-2xl p-6 min-h-[260px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-semibold text-sm">
                Live Cluster Map
              </span>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            </div>
            <div className="flex-1 bg-[#111811] rounded-xl overflow-hidden flex items-center justify-center">
              <img
                src={mapClusterImg}
                alt="Live Cluster Map"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mt-4 flex gap-3">
              {[
                { label: "Active clusters", value: "14" },
                { label: "Pending alerts", value: "3" },
                { label: "Escalated", value: "6" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex-1 bg-[#111811] rounded-lg px-3 py-2 text-center"
                >
                  <p className="text-green-400 font-bold">{value}</p>
                  <p className="text-gray-500 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative z-10 px-4 md:px-8 py-14 md:py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white mb-4">
            Ready to protect your ecosystem?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Join thousands of citizens actively monitoring and reporting
            invasive species across the country.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/signup"
              className="bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-3 rounded-full transition-colors"
            >
              Sign Up Free
            </Link>
            <a
              href="#how"
              className="bg-transparent border border-white/20 hover:border-white/40 text-white font-medium px-6 py-3 rounded-full transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
        <div className="glow-cta" />
      </section>

      {/* Footer */}
      <footer
        id="about"
        className="relative z-10 border-t border-white/5 px-4 md:px-8 py-8 md:py-10"
      >
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
          <Link to="/" className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                <img
                  src={logoImg}
                  alt="EcoSentry"
                  className="w-full h-full object-cover scale-150 origin-center"
                />
              </div>
              <span className="text-white font-semibold text-sm">
                EcoSentry
              </span>
            </div>
            <span className="text-gray-500 text-xs pl-1">
              Invasive Species Prediction
            </span>
          </Link>
          <div className="flex flex-wrap justify-center gap-4">
            {["How it Works", "Species", "Community", "About"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
          <p className="text-gray-600 text-xs">
            © 2026 EcoSentry. EcoTech Track.
          </p>
        </div>
      </footer>
    </div>
  );
}
