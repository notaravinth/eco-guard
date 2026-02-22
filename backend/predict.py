from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import json
import os

app = Flask(__name__)

# Load model and class names
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "ecoguard_plant_model.h5")
CLASS_NAMES_PATH = os.path.join(os.path.dirname(__file__), "models", "class_names.json")

print("Loading model...")
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
