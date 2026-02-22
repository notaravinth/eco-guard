"""
model_server.py
Flask server that exposes a /predict endpoint using the trained h5 model
(model2/keras_model.h5). The Node.js backend proxies image uploads here.

Run:  python model_server.py   (starts on port 5002)
"""

import os

os.environ["TF_USE_LEGACY_KERAS"] = "1"  # use tf-keras (Keras 2) for compat
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

from flask import Flask, request, jsonify
import io
import numpy as np
import tensorflow as tf
from PIL import Image

app = Flask(__name__)

# Paths
MODEL_DIR = os.path.join(os.path.dirname(__file__), "model2")
MODEL_PATH = os.path.join(MODEL_DIR, "keras_model.h5")
LABELS_PATH = os.path.join(MODEL_DIR, "labels.txt")

# Load model & labels once
print("[model_server] Loading model ...")
model = tf.keras.models.load_model(MODEL_PATH, compile=False)
model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])
print("[model_server] Model loaded OK")

input_shape = model.input_shape  # (None, 224, 224, 3)
IMG_HEIGHT = input_shape[1]
IMG_WIDTH = input_shape[2]
print(f"[model_server] Input size: {IMG_WIDTH}x{IMG_HEIGHT}")

# Parse labels.txt -> {0: "lanthana", 1: "Parthenium", ...}
labels: dict[int, str] = {}
with open(LABELS_PATH, "r") as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        idx, name = line.split(maxsplit=1)
        labels[int(idx)] = name

print(f"[model_server] Labels: {labels}")

# Invasive species metadata
INVASIVE_INFO = {
    "lanthana": {
        "invasive": True,
        "commonName": "Lantana",
        "scientificName": "Lantana camara",
        "family": "Verbenaceae",
        "severity": "high",
        "region": "Pan-tropical",
        "description": "Lantana camara is a highly invasive shrub that forms dense thickets, displacing native vegetation and reducing biodiversity.",
    },
    "Parthenium": {
        "invasive": True,
        "commonName": "Parthenium weed",
        "scientificName": "Parthenium hysterophorus",
        "family": "Asteraceae",
        "severity": "high",
        "region": "Pan-tropical",
        "description": "Parthenium hysterophorus is a highly allergenic invasive weed that causes severe crop losses and health issues.",
    },
    "Prosopis": {
        "invasive": True,
        "commonName": "Mesquite",
        "scientificName": "Prosopis juliflora",
        "family": "Fabaceae",
        "severity": "medium",
        "region": "Arid & semi-arid regions",
        "description": "Prosopis juliflora is an invasive tree that depletes groundwater and displaces native dryland species.",
    },
    "Other Plants": {
        "invasive": False,
        "commonName": "Other Plants",
        "scientificName": "Unknown",
        "family": "",
        "severity": None,
        "region": None,
        "description": "Non-invasive plant species.",
    },
    "Flowers": {
        "invasive": False,
        "commonName": "Flowers",
        "scientificName": "Unknown",
        "family": "",
        "severity": None,
        "region": None,
        "description": "Non-invasive flowering plant.",
    },
}


@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    img = Image.open(io.BytesIO(file.read())).convert("RGB")
    img_resized = img.resize((IMG_WIDTH, IMG_HEIGHT))

    arr = np.array(img_resized, dtype=np.float32) / 255.0
    arr = np.expand_dims(arr, axis=0)  # (1, H, W, 3)

    preds = model.predict(arr, verbose=0)
    sorted_indices = np.argsort(preds[0])[::-1]  # descending

    top_idx = int(sorted_indices[0])
    top_confidence = float(preds[0][top_idx])
    top_label = labels.get(top_idx, f"class_{top_idx}")

    info = INVASIVE_INFO.get(top_label, INVASIVE_INFO["Other Plants"])

    # Build top results for all classes
    top_results = []
    for i in sorted_indices:
        i = int(i)
        label = labels.get(i, f"class_{i}")
        linfo = INVASIVE_INFO.get(label, INVASIVE_INFO["Other Plants"])
        top_results.append({
            "scientificName": linfo["scientificName"],
            "commonNames": [linfo["commonName"]],
            "family": linfo["family"],
            "score": round(float(preds[0][i]), 4),
            "invasive": linfo["invasive"],
            "invasiveInfo": {
                "commonName": linfo["commonName"],
                "severity": linfo["severity"],
                "region": linfo["region"],
                "description": linfo["description"],
            } if linfo["invasive"] else None,
        })

    display_name = (
        f"{info['commonName']} ({info['scientificName']})"
        if info["scientificName"] != "Unknown"
        else info["commonName"]
    )

    invasive_info = None
    if info["invasive"]:
        invasive_info = {
            "commonName": info["commonName"],
            "severity": info["severity"],
            "region": info["region"],
            "description": info["description"],
        }

    response = {
        "species": display_name,
        "scientificName": info["scientificName"],
        "commonNames": [info["commonName"]],
        "family": info["family"],
        "confidence": round(top_confidence, 4),
        "invasive": info["invasive"],
        "invasiveInfo": invasive_info,
        "topResults": top_results,
    }

    print(
        f"[model_server] Predicted: {display_name} "
        f"({top_confidence * 100:.1f}%) | Invasive: {info['invasive']}"
    )

    return jsonify(response)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "model2/keras_model.h5"})


if __name__ == "__main__":
    print("[model_server] Starting on port 5002 ...")
    app.run(host="0.0.0.0", port=5002)
