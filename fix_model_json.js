// Converts a Keras 3 TFJS model.json to the legacy format TFJS can load.
// Run once: node fix_model_json.js
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "Frontend/public/model/model.json");
const raw  = JSON.parse(fs.readFileSync(FILE, "utf8"));

// ── Convert a Keras3 __keras_tensor__ → TFJS tuple [name, nodeIdx, tensorIdx, {}]
function tensorToTuple(t) {
  if (t && t.class_name === "__keras_tensor__") {
    const [name, nodeIdx, tensorIdx] = t.config.keras_history;
    return [name, nodeIdx, tensorIdx, {}];
  }
  return t;
}

// ── Convert Keras3 inbound_nodes on a single layer (top-level field, not inside config)
// Keras3 format: [{args: [tensor | [tensor,...]], kwargs:{}}]
// TFJS  format:  [[[name, nodeIdx, tensorIdx, {}]]]   or  [[name, nodeIdx, tensorIdx, {}]]
function fixNodes(nodes) {
  if (!nodes || nodes.length === 0) return [];
  if (Array.isArray(nodes[0])) return nodes; // already legacy

  return nodes.map((node) => {
    const args = node.args ?? [];
    if (args.length === 0) return [];
    const first = args[0];
    if (Array.isArray(first)) {
      // multi-input (Add, Concatenate…)
      return [first.map(tensorToTuple)];
    }
    // single-input
    return [tensorToTuple(first)];
  });
}

// ── Recursively fix all layers (inbound_nodes lives at layer top-level, NOT layer.config)
function fixLayers(layers) {
  return layers.map((layer) => {
    const fixed = { ...layer };

    // Fix top-level inbound_nodes
    if (fixed.inbound_nodes !== undefined) {
      fixed.inbound_nodes = fixNodes(fixed.inbound_nodes);
    }

    // Fix batch_shape → batchInputShape inside config
    const cfg = { ...(fixed.config ?? {}) };
    if (cfg.batch_shape !== undefined) {
      cfg.batchInputShape = cfg.batch_shape;
      delete cfg.batch_shape;
    }

    // Recurse into nested Functional / Sequential
    if (Array.isArray(cfg.layers)) {
      cfg.layers = fixLayers(cfg.layers);
    }

    fixed.config = cfg;
    return fixed;
  });
}

// ── Patch modelTopology
const mc  = raw.modelTopology.model_config;
const cfg = { ...(mc.config ?? {}) };
if (Array.isArray(cfg.layers)) {
  cfg.layers = fixLayers(cfg.layers);
}
raw.modelTopology = {
  ...raw.modelTopology,
  model_config: { ...mc, config: cfg },
};

fs.writeFileSync(FILE, JSON.stringify(raw), "utf8");
console.log("Done — patched model.json written to", FILE);
