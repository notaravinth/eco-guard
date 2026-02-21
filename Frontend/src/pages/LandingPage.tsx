import '../App.css'
import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060d06] text-white overflow-x-hidden">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-white/5 bg-[#060d06]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center text-sm">🌿</div>
          <span className="text-white font-semibold text-sm tracking-wide">EcoGuard</span>
        </div>
        <div className="hidden md:flex items-center gap-1 bg-[#111811] border border-white/10 rounded-full px-2 py-1">
          <a href="#how" className="px-4 py-1.5 text-sm text-gray-300 hover:text-white transition-colors">How it Works</a>
          <a href="#species" className="px-4 py-1.5 text-sm text-gray-300 hover:text-white transition-colors">Species</a>
          <a href="#community" className="px-4 py-1.5 text-sm text-gray-300 hover:text-white transition-colors">Community</a>
          <a href="#about" className="px-4 py-1.5 text-sm text-gray-300 hover:text-white transition-colors">About</a>
        </div>
        <Link
          to="/login"
          className="bg-green-500 hover:bg-green-400 text-black font-semibold text-xs md:text-sm px-4 md:px-5 py-2 rounded-full transition-colors"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 pt-12 md:pt-16 pb-8 md:pb-10">
        <div className="flex items-center gap-2 bg-[#111811] border border-white/10 rounded-full px-3 py-1 mb-6 md:mb-8">
          <span className="bg-green-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">NEW</span>
          <span className="text-xs md:text-sm text-gray-300">AI species detection just launched</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-4 md:mb-6 leading-tight">
          Spot and report.
        </h1>
        <p className="text-gray-400 text-base md:text-lg max-w-sm md:max-w-md mb-8 md:mb-10 px-2">
          Upload a photo of a plant, let our AI identify invasive species,
          and alert the right authorities automatically.
        </p>
        <Link
          to="/signup"
          className="bg-white text-black font-medium text-sm px-6 py-2.5 rounded-full hover:bg-gray-100 transition-colors"
        >
          Report a Sighting
        </Link>
      </div>

      {/* Cards */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-4 px-4 md:px-8 pb-16 md:pb-24 max-w-5xl mx-auto">
        <div className="flex-[2] bg-[#d1d5d1] rounded-2xl h-44 sm:h-56 flex flex-col items-center justify-center gap-2">
          <span className="text-3xl">📸</span>
          <span className="text-gray-600 text-base md:text-lg font-medium text-center px-2">upload the image / take photo</span>
          <span className="text-gray-400 text-xs md:text-sm">JPG, PNG, HEIC supported</span>
        </div>
        <div className="flex-[0.7] bg-[#d1d5d1] rounded-2xl h-44 sm:h-56 flex flex-col items-center justify-center gap-2">
          <span className="text-3xl">📍</span>
          <span className="text-gray-600 text-base md:text-lg font-medium">location</span>
          <span className="text-gray-400 text-xs md:text-sm">Auto or manual</span>
        </div>
      </div>

      <div className="glow-hero" />

      {/* How it Works */}
      <section id="how" className="relative z-10 px-4 md:px-8 py-14 md:py-24 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-green-500 text-sm font-semibold uppercase tracking-widest">Process</span>
          <h2 className="text-2xl md:text-4xl font-bold text-white mt-2">How EcoGuard Works</h2>
          <p className="text-gray-400 mt-3 max-w-lg mx-auto text-sm md:text-base">Three simple steps to protect ecosystems from invasive species — powered by AI and satellite data.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '01', icon: '📸', title: 'Capture & Upload', desc: 'Take a photo or upload an existing image of the plant you suspect is invasive.' },
            { step: '02', icon: '🤖', title: 'AI Recognition', desc: 'Our species model analyzes the image and returns an identification with confidence score.' },
            { step: '03', icon: '🛰️', title: 'Verify & Alert', desc: 'Cross-checked with satellite data. Report automatically escalated to authorities when threshold is met.' },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="bg-[#0d150d] border border-white/10 rounded-2xl p-6 hover:border-green-500/40 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">{icon}</span>
                <span className="text-green-500/40 text-4xl font-bold">{step}</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 border-y border-white/5 bg-[#0a110a] py-14">
        <div className="max-w-5xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
          {[
            { value: '2,400+', label: 'Sightings Reported' },
            { value: '38', label: 'Species Identified' },
            { value: '12', label: 'Regions Monitored' },
            { value: '6', label: 'Govt. Alerts Sent' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-bold text-green-400">{value}</p>
              <p className="text-gray-400 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Species */}
      <section id="species" className="relative z-10 px-4 md:px-8 py-14 md:py-24 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-green-500 text-sm font-semibold uppercase tracking-widest">Database</span>
          <h2 className="text-2xl md:text-4xl font-bold text-white mt-2">Tracked Invasive Species</h2>
          <p className="text-gray-400 mt-3 max-w-lg mx-auto text-sm md:text-base">Our model is trained to recognize the most damaging invasive plants threatening local ecosystems.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Water Hyacinth', threat: 'High', emoji: '🪷' },
            { name: 'Lantana Camara', threat: 'High', emoji: '🌸' },
            { name: 'Parthenium', threat: 'Critical', emoji: '🌼' },
            { name: 'Prosopis Juliflora', threat: 'High', emoji: '🌵' },
            { name: 'Mile-a-Minute', threat: 'Medium', emoji: '🍃' },
            { name: 'Giant Reed', threat: 'High', emoji: '🎋' },
            { name: 'Salvinia Molesta', threat: 'Critical', emoji: '🌿' },
            { name: 'Mimosa Pigra', threat: 'Medium', emoji: '🌱' },
          ].map(({ name, threat, emoji }) => (
            <div key={name} className="bg-[#0d150d] border border-white/10 rounded-xl p-4 hover:border-green-500/40 transition-colors">
              <span className="text-2xl">{emoji}</span>
              <p className="text-white text-sm font-medium mt-2">{name}</p>
              <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full font-medium ${
                threat === 'Critical' ? 'bg-red-500/20 text-red-400' :
                threat === 'High' ? 'bg-orange-500/20 text-orange-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>{threat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Community */}
      <section id="community" className="relative z-10 bg-[#0a110a] border-y border-white/5 px-4 md:px-8 py-14 md:py-24">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <span className="text-green-500 text-sm font-semibold uppercase tracking-widest">Community</span>
            <h2 className="text-2xl md:text-4xl font-bold text-white mt-2 mb-4">Citizens powering ecological defence</h2>
            <p className="text-gray-400 leading-relaxed mb-6">Every sighting you report is cross-referenced with others nearby. When enough reports cluster in one area, our system automatically escalates the alert to the relevant government body.</p>
            <ul className="space-y-3">
              {[
                'Auto-GPS location tagging on every report',
                'Cluster detection across 1km radius zones',
                'Direct escalation to forest & environmental departments',
                'Real-time status updates on your submissions',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 bg-[#0d150d] border border-white/10 rounded-2xl p-6 min-h-[260px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white font-semibold text-sm">Live Cluster Map</span>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            </div>
            <div className="flex-1 bg-[#111811] rounded-xl flex items-center justify-center">
              <span className="text-gray-500 text-sm">🗺️ Map view coming soon</span>
            </div>
            <div className="mt-4 flex gap-3">
              {[
                { label: 'Active clusters', value: '14' },
                { label: 'Pending alerts', value: '3' },
                { label: 'Escalated', value: '6' },
              ].map(({ label, value }) => (
                <div key={label} className="flex-1 bg-[#111811] rounded-lg px-3 py-2 text-center">
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
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Ready to protect your ecosystem?</h2>
          <p className="text-gray-400 mb-8">Join thousands of citizens actively monitoring and reporting invasive species across the country.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-3 rounded-full transition-colors">
              Sign Up Free
            </Link>
            <a href="#how" className="bg-transparent border border-white/20 hover:border-white/40 text-white font-medium px-6 py-3 rounded-full transition-colors">
              Learn More
            </a>
          </div>
        </div>
        <div className="glow-cta" />
      </section>

      {/* Footer */}
      <footer id="about" className="relative z-10 border-t border-white/5 px-4 md:px-8 py-8 md:py-10">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center text-xs">🌿</div>
            <span className="text-white font-semibold text-sm">EcoGuard</span>
            <span className="text-gray-600 text-xs ml-1">Invasive Species Prediction</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {['How it Works', 'Species', 'Community', 'About'].map(link => (
              <a key={link} href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">{link}</a>
            ))}
          </div>
          <p className="text-gray-600 text-xs">© 2026 EcoGuard. EcoTech Track.</p>
        </div>
      </footer>

    </div>
  )
}
