import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { Role } from '../types'

interface Props {
  children: React.ReactNode
  requiredRole?: Role
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060d06] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-700 animate-pulse flex items-center justify-center text-sm">🌿</div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && profile?.role !== requiredRole) {
    // Citizen trying to access admin → redirect to citizen dashboard
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
