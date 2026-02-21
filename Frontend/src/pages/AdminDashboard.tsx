import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AdminDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#060d06] text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 border-b border-white/5 bg-[#060d06]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center text-sm">🌿</div>
          <span className="text-white font-semibold text-sm">EcoGuard</span>
          <span className="bg-green-500/20 text-green-400 text-xs font-medium px-2 py-0.5 rounded-full ml-1">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">🛡️ {profile?.full_name ?? 'Admin'}</span>
          <button
            onClick={handleSignOut}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-1">Admin Dashboard</h1>
          <p className="text-gray-400">Monitor sightings, users, and escalate verified cluster reports.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: '—', icon: '👥' },
            { label: 'Total Sightings', value: '—', icon: '📍' },
            { label: 'Active Clusters', value: '—', icon: '🗺️' },
            { label: 'Escalated', value: '—', icon: '📨' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-[#0d150d] border border-white/10 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">{icon}</p>
              <p className="text-2xl font-bold text-green-400">{value}</p>
              <p className="text-gray-500 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Sections placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0d150d] border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-2">👥 Users</h2>
            <p className="text-gray-500 text-sm">User management coming soon.</p>
          </div>
          <div className="bg-[#0d150d] border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-2">📍 Sightings Map</h2>
            <p className="text-gray-500 text-sm">Live map view coming soon.</p>
          </div>
          <div className="bg-[#0d150d] border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-2">🗺️ Cluster Analysis</h2>
            <p className="text-gray-500 text-sm">Haversine clustering coming soon.</p>
          </div>
          <div className="bg-[#0d150d] border border-white/10 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-2">📋 Activity Logs</h2>
            <p className="text-gray-500 text-sm">Activity logs coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
