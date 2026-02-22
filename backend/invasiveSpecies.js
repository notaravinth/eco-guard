/**
 * Invasive species database for India and global regions.
 * Maps scientific names (lowercase) → info about why they're invasive.
 *
 * Sources: IUCN Global Invasive Species Database, CABI, GISD,
 *          Indian MoEFCC invasive species lists.
 */

const INVASIVE_SPECIES = {
  // ── Major invasive plants in India ──────────────────────────────────
  "lantana camara": {
    commonName: "Lantana",
    severity: "high",
    region: "Pan-India",
    description:
      "One of the world's worst invasive species. Forms dense thickets, displaces native vegetation, toxic to livestock.",
  },
  "prosopis juliflora": {
    commonName: "Mesquite / Vilayati Babool",
    severity: "high",
    region: "Rajasthan, Gujarat, Tamil Nadu, Andhra Pradesh",
    description:
      "Aggressive coloniser of arid lands. Depletes groundwater, displaces native trees.",
  },
  "parthenium hysterophorus": {
    commonName: "Congress Grass / Carrot Grass",
    severity: "high",
    region: "Pan-India",
    description:
      "Causes severe allergic reactions, reduces crop yields by 40%, toxic to livestock.",
  },
  "eichhornia crassipes": {
    commonName: "Water Hyacinth",
    severity: "high",
    region: "Pan-India (aquatic)",
    description:
      "Blocks waterways, reduces dissolved oxygen, destroys aquatic ecosystems.",
  },
  "chromolaena odorata": {
    commonName: "Siam Weed",
    severity: "high",
    region: "Western Ghats, North-East India",
    description:
      "Rapidly colonises disturbed areas, highly flammable, suppresses native regeneration.",
  },
  "mikania micrantha": {
    commonName: "Mile-a-Minute Weed",
    severity: "high",
    region: "North-East India, Western Ghats",
    description:
      "Smothers native vegetation and plantation crops, grows up to 27mm per day.",
  },
  "ageratum conyzoides": {
    commonName: "Billygoat Weed",
    severity: "medium",
    region: "Pan-India",
    description:
      "Aggressive weed in croplands and disturbed habitats, allelopathic effects.",
  },
  "ipomoea carnea": {
    commonName: "Pink Morning Glory / Besharam",
    severity: "medium",
    region: "Pan-India",
    description:
      "Toxic to livestock, invades wetlands and wastelands, forms impenetrable thickets.",
  },
  "salvinia molesta": {
    commonName: "Giant Salvinia",
    severity: "high",
    region: "Kerala, Karnataka, Tamil Nadu",
    description:
      "Aquatic fern that doubles biomass every 2-3 days, clogs waterways.",
  },
  "opuntia stricta": {
    commonName: "Prickly Pear Cactus",
    severity: "medium",
    region: "Tamil Nadu, Andhra Pradesh, Karnataka",
    description:
      "Invades dry grasslands and scrublands, injures livestock with spines.",
  },
  "leucaena leucocephala": {
    commonName: "Subabul / Lead Tree",
    severity: "medium",
    region: "Pan-India",
    description:
      "Fast-growing tree that forms monocultures, displaces native species.",
  },
  "cassia tora": {
    commonName: "Sickle Senna",
    severity: "low",
    region: "Pan-India",
    description: "Common weed in agricultural and disturbed areas.",
  },
  "senna tora": {
    commonName: "Sickle Senna",
    severity: "low",
    region: "Pan-India",
    description: "Common weed in agricultural and disturbed areas.",
  },
  "alternanthera philoxeroides": {
    commonName: "Alligator Weed",
    severity: "high",
    region: "Pan-India (aquatic/semi-aquatic)",
    description:
      "Clogs waterways, reduces biodiversity in wetlands, difficult to eradicate.",
  },
  "pistia stratiotes": {
    commonName: "Water Lettuce",
    severity: "medium",
    region: "Pan-India (aquatic)",
    description:
      "Floating aquatic weed that blocks sunlight, reduces oxygen in water bodies.",
  },
  "mimosa diplotricha": {
    commonName: "Giant Sensitive Plant",
    severity: "medium",
    region: "North-East India, Western Ghats",
    description:
      "Thorny scrambling vine that smothers native vegetation and injures animals.",
  },
  "hyptis suaveolens": {
    commonName: "Bush Mint / Vilayati Tulsi",
    severity: "medium",
    region: "Pan-India",
    description:
      "Aromatic weed that invades pastures and agricultural land, allelopathic.",
  },

  // ── Global invasive species (commonly flagged) ────────────────────
  "reynoutria japonica": {
    commonName: "Japanese Knotweed",
    severity: "high",
    region: "Europe, North America",
    description:
      "Extremely aggressive, damages infrastructure, nearly impossible to eradicate.",
  },
  "fallopia japonica": {
    commonName: "Japanese Knotweed",
    severity: "high",
    region: "Europe, North America",
    description:
      "Extremely aggressive, damages infrastructure, nearly impossible to eradicate.",
  },
  "pueraria montana": {
    commonName: "Kudzu",
    severity: "high",
    region: "Southeastern USA",
    description:
      "Vine that grows 30 cm/day, smothers trees and structures, 'the vine that ate the South'.",
  },
  "ailanthus altissima": {
    commonName: "Tree of Heaven",
    severity: "high",
    region: "Global",
    description:
      "Fast-growing tree, allelopathic, hosts spotted lanternfly, displaces native trees.",
  },
  "robinia pseudoacacia": {
    commonName: "Black Locust",
    severity: "medium",
    region: "Europe (invasive outside N. America)",
    description:
      "Nitrogen-fixing tree that alters soil chemistry and displaces native species.",
  },
  "impatiens glandulifera": {
    commonName: "Himalayan Balsam",
    severity: "medium",
    region: "Europe, North America",
    description:
      "Explosive seed dispersal, outcompetes native riparian plants.",
  },
  "myriophyllum aquaticum": {
    commonName: "Parrot's Feather",
    severity: "medium",
    region: "Global (aquatic)",
    description: "Dense mats block waterways, reduce dissolved oxygen.",
  },
  "arundo donax": {
    commonName: "Giant Reed",
    severity: "high",
    region: "Global",
    description:
      "Grows 10cm/day, consumes enormous water, highly flammable, displaces riparian habitat.",
  },
  "hedychium gardnerianum": {
    commonName: "Kahili Ginger",
    severity: "medium",
    region: "Tropical islands, Azores, Hawaii",
    description:
      "Shade-tolerant invader of forest understories, displaces native ferns.",
  },
  "tamarix ramosissima": {
    commonName: "Saltcedar / Tamarisk",
    severity: "high",
    region: "Western USA, Mediterranean",
    description:
      "Depletes water tables, increases soil salinity, displaces native riparian species.",
  },
  "acacia mearnsii": {
    commonName: "Black Wattle",
    severity: "medium",
    region: "Southern Africa, South America, India (Nilgiris)",
    description:
      "Invades grasslands and fynbos, increases fire risk, consumes excessive water.",
  },
  "clidemia hirta": {
    commonName: "Koster's Curse",
    severity: "high",
    region: "Tropical Pacific, Southeast Asia",
    description:
      "Shade-tolerant shrub that invades forest understories, bird-dispersed.",
  },
  "psidium cattleianum": {
    commonName: "Strawberry Guava",
    severity: "high",
    region: "Hawaii, tropical islands",
    description:
      "Forms dense monocultures in tropical forests, displaces native species.",
  },
  "cinchona pubescens": {
    commonName: "Quinine Tree",
    severity: "medium",
    region: "Galapagos, tropical highlands",
    description: "Invades cloud forests, displaces endemic species.",
  },
  "schinus terebinthifolia": {
    commonName: "Brazilian Peppertree",
    severity: "high",
    region: "Florida, Hawaii, tropical regions",
    description:
      "Fast-growing tree-shrub that forms dense stands, bird-dispersed seeds.",
  },
  "ligustrum lucidum": {
    commonName: "Glossy Privet",
    severity: "medium",
    region: "South America, Australia, Southern USA",
    description:
      "Shade-tolerant tree that invades forests, bird-dispersed fruits.",
  },
  "tradescantia fluminensis": {
    commonName: "Wandering Jew",
    severity: "medium",
    region: "Australia, New Zealand, Southern USA",
    description:
      "Dense ground cover that prevents native seedling establishment.",
  },
  "ulex europaeus": {
    commonName: "Gorse",
    severity: "high",
    region: "New Zealand, Australia, Americas",
    description:
      "Thorny shrub, highly flammable, forms impenetrable thickets on hillsides.",
  },
  "rubus ellipticus": {
    commonName: "Yellow Himalayan Raspberry",
    severity: "medium",
    region: "Hawaii, East Africa",
    description: "Thorny scrambler that invades forest gaps and edges.",
  },
  "broussonetia papyrifera": {
    commonName: "Paper Mulberry",
    severity: "medium",
    region: "Pakistan, India, Southeast Asia",
    description:
      "Fast-growing tree that displaces native species; major allergen.",
  },
  "spathodea campanulata": {
    commonName: "African Tulip Tree",
    severity: "medium",
    region: "Pacific Islands, Hawaii",
    description:
      "Fast-growing tree, nectar toxic to native bees, displaces native forest.",
  },
};

/**
 * Check if a species (by scientific name) is in the invasive database.
 * Supports partial matching for genus-level checks.
 *
 * @param {string} scientificName - e.g. "Lantana camara"
 * @returns {{ invasive: boolean, info?: object }}
 */
function checkInvasive(scientificName) {
  if (!scientificName) return { invasive: false };

  const key = scientificName.toLowerCase().trim();

  // Exact match
  if (INVASIVE_SPECIES[key]) {
    return { invasive: true, info: INVASIVE_SPECIES[key] };
  }

  // Genus-level match (e.g. "Lantana" matches "Lantana camara")
  const genus = key.split(" ")[0];
  for (const [speciesKey, info] of Object.entries(INVASIVE_SPECIES)) {
    if (speciesKey.startsWith(genus + " ")) {
      return {
        invasive: true,
        info: { ...info, note: `Matched at genus level (${genus})` },
      };
    }
  }

  return { invasive: false };
}

module.exports = { checkInvasive, INVASIVE_SPECIES };
