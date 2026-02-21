import { useRef, useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useLocation as useLocationHook } from '../../hooks/useLocation'
import type { LocationData } from '../../hooks/useLocation'

// Fix leaflet default marker icon (known Vite/webpack issue)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Props {
  onClose: () => void
  onSubmit: (image: File, location: LocationData) => void
}

// Inner component — lets user click map to place marker
function MapPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

type Step = 'capture' | 'locating' | 'review' | 'map'

export default function ImageCaptureModal({ onClose, onSubmit }: Props) {
  const uploadRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('capture')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState('')
  const [mapMarker, setMapMarker] = useState<{ lat: number; lng: number } | null>(null)

  const { location, setLocation, locLoading, requestGPS } = useLocationHook()

  // When an image is chosen, try EXIF → GPS → fallback to map
  async function handleImageSelected(file: File) {
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setStep('locating')
    setStatusMsg('Reading location from image...')

    // Step 1 — try EXIF GPS from the image
    try {
      const exifr = await import('exifr')
      const gps = await exifr.gps(file)
      if (gps?.latitude && gps?.longitude) {
        setLocation({ lat: gps.latitude, lng: gps.longitude, source: 'exif' })
        setStatusMsg('Location found in photo metadata ✓')
        setStep('review')
        return
      }
    } catch {
      // exifr failed — continue to GPS
    }

    // Step 2 — try browser GPS
    setStatusMsg('Requesting device GPS...')
    const gpsResult = await requestGPS()
    if (gpsResult) {
      setStatusMsg('Location from GPS ✓')
      setStep('review')
      return
    }

    // Step 3 — fallback: manual map
    setStatusMsg('Could not detect location. Please pin it on the map.')
    setStep('map')
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleImageSelected(file)
  }

  function handleMapPick(lat: number, lng: number) {
    setMapMarker({ lat, lng })
    setLocation({ lat, lng, source: 'manual' })
  }

  function handleConfirmMap() {
    if (mapMarker) {
      setStep('review')
      setStatusMsg('Manual location pinned ✓')
    }
  }

  function handleSubmit() {
    if (imageFile && location) {
      onSubmit(imageFile, location)
    }
  }

  const sourceLabel: Record<string, string> = {
    gps: '📡 Device GPS',
    exif: '🖼️ Photo metadata',
    manual: '📌 Manually pinned',
  }

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
      <div className="bg-[#0d150d] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">
            {step === 'capture' && '📸 Report a Sighting'}
            {step === 'locating' && '🔍 Detecting Location...'}
            {step === 'map' && '📌 Pin Your Location'}
            {step === 'review' && '✅ Review & Submit'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-6">

          {/* STEP 1 — Capture */}
          {step === 'capture' && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm mb-6">Choose how to add your sighting image.</p>
              <button
                onClick={() => uploadRef.current?.click()}
                className="w-full flex items-center gap-4 bg-[#111811] border border-white/10 hover:border-green-500/40 rounded-xl px-5 py-4 transition-colors text-left"
              >
                <span className="text-3xl">📁</span>
                <div>
                  <p className="text-white font-medium text-sm">Upload from Gallery</p>
                  <p className="text-gray-500 text-xs mt-0.5">Choose an existing photo from your device</p>
                </div>
              </button>
              <button
                onClick={() => cameraRef.current?.click()}
                className="w-full flex items-center gap-4 bg-[#111811] border border-white/10 hover:border-green-500/40 rounded-xl px-5 py-4 transition-colors text-left"
              >
                <span className="text-3xl">📷</span>
                <div>
                  <p className="text-white font-medium text-sm">Take a Photo</p>
                  <p className="text-gray-500 text-xs mt-0.5">Open camera to capture right now</p>
                </div>
              </button>
              {/* Hidden inputs */}
              <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileInput} />
            </div>
          )}

          {/* STEP 2 — Locating */}
          {step === 'locating' && (
            <div className="flex flex-col items-center gap-4 py-8">
              {imagePreview && (
                <img src={imagePreview} alt="preview" className="w-32 h-32 object-cover rounded-xl border border-white/10" />
              )}
              <div className="flex items-center gap-2">
                {locLoading && <span className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin inline-block" />}
                <p className="text-gray-300 text-sm">{statusMsg}</p>
              </div>
            </div>
          )}

          {/* STEP 3 — Manual map */}
          {step === 'map' && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">{statusMsg}</p>
              <div className="rounded-xl overflow-hidden border border-white/10 h-64">
                <MapContainer
                  center={[20.5937, 78.9629]}
                  zoom={5}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapPicker onPick={handleMapPick} />
                  {mapMarker && <Marker position={[mapMarker.lat, mapMarker.lng]} />}
                </MapContainer>
              </div>
              {mapMarker && (
                <p className="text-green-400 text-xs text-center">
                  📌 Pinned: {mapMarker.lat.toFixed(5)}, {mapMarker.lng.toFixed(5)}
                </p>
              )}
              <button
                onClick={handleConfirmMap}
                disabled={!mapMarker}
                className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                Confirm Location
              </button>
            </div>
          )}

          {/* STEP 4 — Review */}
          {step === 'review' && imageFile && location && (
            <div className="space-y-4">
              {/* Image preview */}
              <div className="relative">
                <img
                  src={imagePreview!}
                  alt="sighting"
                  className="w-full h-48 object-cover rounded-xl border border-white/10"
                />
                <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                  {imageFile.name}
                </span>
              </div>

              {/* Location summary */}
              <div className="bg-[#111811] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">📍 Location Captured</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                </div>
                <span className="text-green-400 text-xs bg-green-500/10 px-2 py-1 rounded-full">
                  {sourceLabel[location.source]}
                </span>
              </div>

              {/* Change location link */}
              <button
                onClick={() => setStep('map')}
                className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
              >
                ✎ Change location manually
              </button>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-xl transition-colors"
              >
                Submit Sighting
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
