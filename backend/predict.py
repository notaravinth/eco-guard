from flask import Flask, request, jsonify
import os
import json
import io

# ── Keras 3 / TF 2.16+ compatibility patch ───────────────────────────────────
# The .h5 was saved with Keras 2, which wrote `groups=1` into DepthwiseConv2D's
# saved config. Keras 3 raises ValueError when it sees that unknown kwarg.
# The h5 loader calls DepthwiseConv2D.from_config(config), which does cls(**config).
# Patching from_config to strip `groups` before the call fixes it without any
# new packages or internet access.
import keras.layers as _kl
_orig_from_config = _kl.DepthwiseConv2D.from_config.__func__  # underlying function

@classmethod
def _patched_from_config(cls, config):
    config.pop("groups", None)
    return _orig_from_config(cls, config)

_kl.DepthwiseConv2D.from_config = _patched_from_config
# ─────────────────────────────────────────────────────────────────────────────

import tensorflow as tf
import numpy as np
from PIL import Image

app = Flask(__name__)

# Load model and class names
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "ecoguard_plant_model.h5")
CLASS_NAMES_PATH = os.path.join(os.path.dirname(__file__), "models", "class_names.json")

print("Loading model...")
<<<<<<< HEAD
# Custom wrapper to handle deprecated 'groups' parameter in old models
class DepthwiseConv2DWrapper(tf.keras.layers.DepthwiseConv2D):
    def __init__(self, **kwargs):
        kwargs.pop('groups', None)  # Remove unsupported 'groups' parameter
        super().__init__(**kwargs)

# compile=False skips optimizer loading — avoids version mismatch errors
model = tf.keras.models.load_model(
    MODEL_PATH, 
    compile=False,
    custom_objects={'DepthwiseConv2D': DepthwiseConv2DWrapper}
)
model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])
=======
model = tf.keras.models.load_model(MODEL_PATH, compile=False)
>>>>>>> f5fd8796922fb144319043f5ff47b5599c24b0f5
y"])
print("✅ Model loaded!")

with open(CLASS_NAMES_PATH) as f:
    class_names = json.load(f)  # { "0": "lantana", "1": "native", ... }

@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    img = Image.open(io.BytesIO(file.read())).convert("RGB")
    img = img.resize((224, 224))

    arr = np.array(img) / 255.0
    arr = np.expand_dims(arr, axis=0)  # shape: (1, 224, 224, 3)

    preds = model.predict(arr)
    idx = int(np.argmax(preds[0]))
    confidence = float(preds[0][idx])
    species = class_names[str(idx)]

    return jsonify({
        "species": species,
        "confidence": round(confidence, 4),
        "all_scores": {class_names[str(i)]: round(float(preds[0][i]), 4) for i in range(len(preds[0]))}
    })

if __name__ == "__main__":
    app.run(port=5001)
    print("🚀 Python prediction server running on port 5001")
