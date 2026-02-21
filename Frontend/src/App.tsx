import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-green-700 mb-4">
            🌿 EcoGuard
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Invasive Species Prediction & Tracking System
          </p>
          <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Welcome to EcoGuard
            </h2>
            <p className="text-gray-600 mb-6">
              Upload images of plants to identify invasive species, verify with satellite data, 
              and alert authorities for ecological protection.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                <div className="text-4xl mb-3">📸</div>
                <h3 className="font-semibold text-green-800 mb-2">Upload Image</h3>
                <p className="text-sm text-gray-600">Capture and upload plant photos</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                <div className="text-4xl mb-3">🤖</div>
                <h3 className="font-semibold text-blue-800 mb-2">AI Recognition</h3>
                <p className="text-sm text-gray-600">Species identification model</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
                <div className="text-4xl mb-3">🛰️</div>
                <h3 className="font-semibold text-purple-800 mb-2">Satellite Verify</h3>
                <p className="text-sm text-gray-600">Confirmation with map data</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-6">
            <p className="text-lg font-medium">
              ✅ Vite + React + TypeScript + Tailwind CSS Setup Complete!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
