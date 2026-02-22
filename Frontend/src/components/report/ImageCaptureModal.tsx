import { useRef, useState, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation as useLocationHook } from "../../hooks/useLocation";
import type { LocationData } from "../../hooks/useLocation";

// Fix leaflet default marker icon (known Vite/webpack issue)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Props {
  onClose: () => void;
  onSubmit: (image: File, location: LocationData, category: string) => void;
}

const CATEGORIES = [
  {
    value: "plant",
    label: "Plant",
    desc: "Invasive ground plants, shrubs, vines",
  },
  { value: "tree", label: "Tree", desc: "Invasive or diseased trees" },
  { value: "flower", label: "Flower", desc: "Non-native flowering species" },
  { value: "animal", label: "Animal", desc: "Invasive mammals or reptiles" },
  { value: "bird", label: "Bird", desc: "Invasive or migratory bird species" },
  {
    value: "insect",
    label: "Insect",
    desc: "Pest insects or invasive arthropods",
  },
  { value: "other", label: "Other", desc: "Anything that does not fit above" },
];

// Inner component — lets user click map to place marker
function MapPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Fly map to a location when it changes
function MapFlyTo({ coords }: { coords: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo([coords.lat, coords.lng], 14, { duration: 1.2 });
    }
  }, [coords, map]);
  return null;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

type Step = "capture" | "locating" | "map" | "category" | "review";

export default function ImageCaptureModal({ onClose, onSubmit }: Props) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // Detect touch/mobile device
  const [isMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches,
  );

  const [step, setStep] = useState<Step>("capture");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [mapMarker, setMapMarker] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [category, setCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { location, setLocation, locLoading, requestGPS } = useLocationHook();

  // Debounced location search via Nominatim (OpenStreetMap)
  const searchLocation = useCallback((query: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const encoded = encodeURIComponent(query.trim());
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=5&countrycodes=in`,
          { headers: { "User-Agent": "EcoSentry/1.0" } },
        );
        const data = (await res.json()) as SearchResult[];
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  function handleSearchSelect(result: SearchResult) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMapMarker({ lat, lng });
    setLocation({ lat, lng, source: "manual" });
    setFlyTarget({ lat, lng });
    setSearchResults([]);
    setSearchQuery(result.display_name.split(",")[0]);
  }

  // When an image is chosen, try EXIF → GPS → fallback to map
  async function handleImageSelected(file: File) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setStep("locating");
    setStatusMsg("Reading location from image...");

    // Step 1 — try EXIF GPS from the image
    try {
      const exifr = await import("exifr");
      const gps = await exifr.gps(file);
      if (gps?.latitude && gps?.longitude) {
        setLocation({ lat: gps.latitude, lng: gps.longitude, source: "exif" });
        setStatusMsg("Location found in photo metadata");
        setStep("category");
        return;
      }
    } catch {
      // exifr failed — continue to GPS
    }

    // Step 2 — try browser GPS
    setStatusMsg("Requesting device GPS...");
    const gpsResult = await requestGPS();
    if (gpsResult) {
      setStatusMsg("Location from GPS");
      setStep("category");
      return;
    }

    // Step 3 — fallback: manual map
    setStatusMsg("Could not detect location. Please pin it on the map.");
    setStep("map");
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleImageSelected(file);
  }

  function handleMapPick(lat: number, lng: number) {
    setMapMarker({ lat, lng });
    setLocation({ lat, lng, source: "manual" });
  }

  function handleConfirmMap() {
    if (mapMarker) {
      setStatusMsg("Manual location pinned");
      setStep("category");
    }
  }

  function handleSubmit() {
    if (imageFile && location && category) {
      onSubmit(imageFile, location, category);
    }
  }

  const sourceLabel: Record<string, string> = {
    gps: "Device GPS",
    exif: "Photo metadata",
    manual: "Manually pinned",
  };

  const stepTitle: Record<Step, string> = {
    capture: "Report a Sighting",
    locating: "Detecting Location",
    map: "Pin Your Location",
    category: "Select Category",
    review: "Review & Submit",
  };

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
      <div className="bg-[#0d150d] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">
            {stepTitle[step]}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-6">
          {/* STEP 1 — Capture */}
          {step === "capture" && (
            <div className="space-y-3">
              <p className="text-gray-400 text-sm mb-4">
                Add an image of the suspected invasive species.
              </p>

              {/* Upload — always shown */}
              <button
                onClick={() => uploadRef.current?.click()}
                className="w-full flex items-center gap-4 bg-[#111811] border border-white/10 hover:border-green-500/40 rounded-xl px-5 py-4 transition-colors text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <svg
                    className="w-5 h-5 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">
                    Upload from {isMobile ? "Gallery" : "Folder"}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {isMobile
                      ? "Choose an existing photo from your gallery"
                      : "Select an image file from your computer"}
                  </p>
                </div>
              </button>

              {/* Camera — mobile only */}
              {isMobile && (
                <button
                  onClick={() => cameraRef.current?.click()}
                  className="w-full flex items-center gap-4 bg-[#111811] border border-white/10 hover:border-green-500/40 rounded-xl px-5 py-4 transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <svg
                      className="w-5 h-5 text-green-400"
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
                    <p className="text-white font-medium text-sm">
                      Take a Photo
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Open camera to capture right now
                    </p>
                  </div>
                </button>
              )}

              {/* Hidden inputs */}
              <input
                ref={uploadRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInput}
              />
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          )}

          {/* STEP 2 — Locating */}
          {step === "locating" && (
            <div className="flex flex-col items-center gap-4 py-8">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="preview"
                  className="w-32 h-32 object-cover rounded-xl border border-white/10"
                />
              )}
              <div className="flex items-center gap-2">
                {locLoading && (
                  <span className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin inline-block" />
                )}
                <p className="text-gray-300 text-sm">{statusMsg}</p>
              </div>
            </div>
          )}

          {/* STEP 3 — Manual map */}
          {step === "map" && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">{statusMsg}</p>

              {/* Search bar */}
              <div className="relative">
                <div className="flex items-center gap-2 bg-[#111811] border border-white/10 rounded-xl px-3 py-2 focus-within:border-green-500/50 transition-colors">
                  <svg
                    className="w-4 h-4 text-gray-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchLocation(e.target.value);
                    }}
                    placeholder="Search by place name or pincode..."
                    className="w-full bg-transparent text-white text-sm placeholder-gray-500 outline-none"
                  />
                  {searching && (
                    <span className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  )}
                </div>

                {/* Search results dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute z-[1000] mt-1 w-full bg-[#111811] border border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {searchResults.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearchSelect(r)}
                        className="w-full text-left px-4 py-2.5 hover:bg-green-500/10 transition-colors border-b border-white/5 last:border-b-0"
                      >
                        <p className="text-white text-sm truncate">
                          {r.display_name.split(",")[0]}
                        </p>
                        <p className="text-gray-500 text-xs truncate mt-0.5">
                          {r.display_name}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl overflow-hidden border border-white/10 h-64">
                <MapContainer
                  center={[20.5937, 78.9629]}
                  zoom={5}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapPicker onPick={handleMapPick} />
                  <MapFlyTo coords={flyTarget} />
                  {mapMarker && (
                    <Marker position={[mapMarker.lat, mapMarker.lng]} />
                  )}
                </MapContainer>
              </div>
              {mapMarker && (
                <p className="text-green-400 text-xs text-center">
                  Pinned: {mapMarker.lat.toFixed(5)}, {mapMarker.lng.toFixed(5)}
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

          {/* STEP 4 — Category */}
          {step === "category" && (
            <div className="space-y-4">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="sighting"
                  className="w-full h-36 object-cover rounded-xl border border-white/10"
                />
              )}
              <p className="text-gray-400 text-sm">
                What category best describes what you spotted?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all ${
                      category === cat.value
                        ? "border-green-500 bg-green-500/10"
                        : "border-white/10 bg-[#111811] hover:border-green-500/40"
                    }`}
                  >
                    <p
                      className={`font-medium text-sm ${
                        category === cat.value ? "text-green-400" : "text-white"
                      }`}
                    >
                      {cat.label}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5 leading-tight">
                      {cat.desc}
                    </p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep("review")}
                disabled={!category}
                className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                Continue
              </button>
            </div>
          )}

          {/* STEP 5 — Review */}
          {step === "review" && imageFile && location && (
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
                  <p className="text-white text-sm font-medium">
                    Location Captured
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                </div>
                <span className="text-green-400 text-xs bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">
                  {sourceLabel[location.source]}
                </span>
              </div>

              {/* Category summary */}
              <div className="bg-[#111811] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">Category</p>
                  <p className="text-gray-400 text-xs mt-0.5 capitalize">
                    {category}
                  </p>
                </div>
                <button
                  onClick={() => setStep("category")}
                  className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
                >
                  Change
                </button>
              </div>

              {/* Change location link */}
              <button
                onClick={() => setStep("map")}
                className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
              >
                Change location manually
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
  );
}
