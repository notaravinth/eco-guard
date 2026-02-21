const ee = require("@google/earthengine");
const privateKey = require("./service-account-key.json");

ee.data.authenticateViaPrivateKey(
  privateKey,
  () => {
    ee.initialize(null, null, () => {
      console.log("✅ Earth Engine initialized");
    });
  },
  (err) => {
    console.error("❌ Earth Engine authentication failed", err);
  },
);

function checkNDVI(lat, lon, radius, callback) {
  const point = ee.Geometry.Point([lon, lat]);
  const area = point.buffer(radius);

  // ✅ Use HARMONIZED collection — works for ALL global locations
  const dataset = ee
    .ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 50)); // ✅ Relaxed cloud filter

  function addNDVI(image) {
    const ndvi = image.normalizedDifference(["B8", "B4"]).rename("NDVI");
    return image.addBands(ndvi);
  }

  // ✅ Much wider date ranges
  const past = dataset
    .filterDate("2024-06-01", "2024-09-30")
    .filterBounds(area)
    .map(addNDVI)
    .mean()
    .select("NDVI");

  const recent = dataset
    .filterDate("2024-10-01", "2025-01-31")
    .filterBounds(area)
    .map(addNDVI)
    .mean()
    .select("NDVI");

  const change = recent.subtract(past);

  // ✅ Check image count first before reducing
  const pastCount = dataset
    .filterDate("2024-06-01", "2024-09-30")
    .filterBounds(area)
    .size();

  const recentCount = dataset
    .filterDate("2024-10-01", "2025-01-31")
    .filterBounds(area)
    .size();

  pastCount.evaluate((pCount) => {
    recentCount.evaluate((rCount) => {
      console.log(`📸 Past images found: ${pCount}`);
      console.log(`📸 Recent images found: ${rCount}`);

      if (pCount === 0 || rCount === 0) {
        return callback({
          ndvi_change: null,
          anomaly: false,
          severity: "NONE",
          message: `⚠️ Not enough images — Past: ${pCount}, Recent: ${rCount}. Try larger radius.`,
        });
      }

      change
        .reduceRegion({
          reducer: ee.Reducer.mean(),
          geometry: area,
          scale: 30, // ✅ Increased scale for better coverage
          maxPixels: 1e9,
        })
        .evaluate((result) => {
          console.log("🔍 Raw GEE result:", result);

          if (!result || result.NDVI === null || result.NDVI === undefined) {
            return callback({
              ndvi_change: null,
              anomaly: false,
              severity: "NONE",
              message: "⚠️ No NDVI data returned. Try increasing radius.",
            });
          }

          const value = result.NDVI;
          const anomaly = Math.abs(value) > 0.05;

          callback({
            ndvi_change: parseFloat(value.toFixed(4)),
            anomaly: anomaly,
            severity:
              Math.abs(value) > 0.3
                ? "HIGH"
                : Math.abs(value) > 0.15
                  ? "MEDIUM"
                  : "LOW",
            message: anomaly
              ? "🚨 Vegetation anomaly detected"
              : "✅ Normal vegetation",
          });
        });
    });
  });
}

module.exports = { checkNDVI };
