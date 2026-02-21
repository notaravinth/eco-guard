import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import ImageCaptureModal from '../components/report/ImageCaptureModal'
import type { LocationData } from '../hooks/useLocation'

export default function CitizenDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)

  function handleSightingSubmit(image: File, location: LocationData) {
    // TODO: upload image to Supabase Storage + save sighting to DB
    console.log('Sighting submitted:', { image, location })
    setShowModal(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
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
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center text-sm">🌿</div>
          <span className="text-white font-semibold text-sm">EcoGuard</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-gray-400 text-sm truncate max-w-[120px]">👤 {profile?.full_name ?? 'Citizen'}</span>
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
          <h1 className="text-3xl font-bold text-white mb-1">
            Hello, {profile?.full_name?.split(' ')[0] ?? 'Citizen'} 👋
          </h1>
          <p className="text-gray-400">Report invasive species and track your submissions.</p>
        </div>

        {/* Report button */}
        <div className="bg-[#0d150d] border border-white/10 rounded-2xl p-5 md:p-8 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Spotted something?</h2>
            <p className="text-gray-400 text-sm">Upload an image of a suspected invasive species with your location.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="w-full md:w-auto bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-3 rounded-full transition-colors"
          >
            📸 Report a Sighting
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
          {[
            { label: 'My Reports', value: '0' },
            { label: 'Verified', value: '0' },
            { label: 'Escalated', value: '0' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#0d150d] border border-white/10 rounded-xl p-3 md:p-4 text-center">
              <p className="text-xl md:text-2xl font-bold text-green-400">{value}</p>
              <p className="text-gray-500 text-xs md:text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Past sightings placeholder */}
        <div className="bg-[#0d150d] border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-4xl mb-3">🌿</p>
          <p className="text-gray-400 text-sm">No sightings reported yet.<br />Use the button above to make your first report.</p>
        </div>
      </div>
    </div>
  )
}
