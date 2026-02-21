import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Smart redirect: sends user to correct dashboard based on role
export default function DashboardRedirect() {
  const { profile, loading, session } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    if (profile?.role === 'admin') {
      navigate('/admin', { replace: true })
    } else {
      navigate('/citizen', { replace: true })
    }
  }, [profile, loading, session, navigate])

  return (
    <div className="min-h-screen bg-[#060d06] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-700 animate-pulse flex items-center justify-center text-sm">🌿</div>
        <p className="text-gray-500 text-sm">Redirecting...</p>
      </div>
    </div>
  )
}
