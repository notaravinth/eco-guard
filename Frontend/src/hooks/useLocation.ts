import { useState, useCallback } from 'react'

export interface LocationData {
  lat: number
  lng: number
  source: 'gps' | 'exif' | 'manual'
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [locLoading, setLocLoading] = useState(false)
  const [locError, setLocError] = useState<string | null>(null)

  const requestGPS = useCallback((): Promise<LocationData | null> => {
    return new Promise(resolve => {
      if (!navigator.geolocation) {
        setLocError('Geolocation not supported by this browser')
        resolve(null)
        return
      }
      setLocLoading(true)
      setLocError(null)
      navigator.geolocation.getCurrentPosition(
        pos => {
          const data: LocationData = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            source: 'gps',
          }
          setLocation(data)
          setLocLoading(false)
          resolve(data)
        },
        err => {
          setLocError(err.message)
          setLocLoading(false)
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 8000 }
      )
    })
  }, [])

  return { location, setLocation, locLoading, locError, requestGPS }
}
