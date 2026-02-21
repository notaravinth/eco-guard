const { checkNDVI } = require("./satellite");

// ✅ Test Locations — Change these to test different areas
const testLocations = [
  { name: "Wayanad, Kerala", lat: 11.6854, lon: 76.132, radius: 3000 },
  { name: "Nilgiris, TN", lat: 11.4102, lon: 76.695, radius: 3000 },
  { name: "Munnar, Kerala", lat: 10.0889, lon: 77.0595, radius: 3000 },
  { name: "Chennai (Urban)", lat: 13.14221, lon: 80.04689, radius: 3000 },
];

// ✅ Pick which location to test (change index 0,1,2,3)
const test = testLocations[0];

console.log(`\n📍 Testing: ${test.name}`);
console.log(`   Lat: ${test.lat}, Lon: ${test.lon}, Radius: ${test.radius}m`);
console.log(`⏳ Waiting for GEE response...\n`);

// Wait for EE to initialize before calling
setTimeout(() => {
  checkNDVI(test.lat, test.lon, test.radius, (result) => {
    console.log("\n📊 ===== RESULT =====");
    console.log(`📍 Location  : ${test.name}`);
    console.log(`📈 NDVI Change: ${result.ndvi_change}`);
    console.log(`🚨 Anomaly   : ${result.anomaly}`);
    console.log(`⚠️  Severity  : ${result.severity}`);
    console.log(`💬 Message   : ${result.message}`);
    console.log("====================\n");
  });
}, 5000); // 5 sec delay for EE to initialize
