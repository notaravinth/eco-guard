export type Role = 'citizen' | 'admin'

export interface Profile {
  id: string
  full_name: string
  role: Role
  created_at: string
}

export interface Sighting {
  id: string
  user_id: string
  image_url: string
  latitude: number
  longitude: number
  species_name: string | null
  confidence_score: number | null
  satellite_verified: boolean
  status: 'pending' | 'verified' | 'escalated'
  created_at: string
}

export interface AuthUser {
  id: string
  email: string
  profile: Profile | null
}
