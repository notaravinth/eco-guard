import tensorflow as tf
import numpy as np
from PIL import Image
import json
import os
import sys

# ── Paths ──────────────────────────────────────────────────────────────
BASE    = os.path.dirname(os.path.abspath(__file__))
MODEL   = os.path.join(BASE, "models", "ecoguard_plant_model_final.h5")
CLASSES = os.path.join(BASE, "models", "class_names.json")

# ── Load model ─────────────────────────────────────────────────────────
print("⏳ Loading model...")
model = tf.keras.models.load_model(MODEL, compile=False)
print("✅ Model ready!\n")

with open(CLASSES) as f:
    class_names = json.load(f)   # {"0":"lantana", "1":"native", ...}

# ── Get image path ─────────────────────────────────────────────────────
if len(sys.argv) > 1:
    img_path = sys.argv[1]       # pass as argument: python run_predict.py image.jpg
else:
    img_path = input("📂 Enter image path: ").strip().strip('"')

if not os.path.exists(img_path):
    print(f"❌ File not found: {img_path}")
    sys.exit(1)

# ── Preprocess ─────────────────────────────────────────────────────────
img = Image.open(img_path).convert("RGB").resize((224, 224))
arr = np.array(img) / 255.0
arr = np.expand_dims(arr, axis=0)   # shape → (1, 224, 224, 3)

# ── Predict ────────────────────────────────────────────────────────────
preds      = model.predict(arr, verbose=0)
idx        = int(np.argmax(preds[0]))
confidence = float(preds[0][idx])
species    = class_names[str(idx)]

# ── Results ────────────────────────────────────────────────────────────
print("\n📊 ══════ PREDICTION RESULT ══════")
print(f"   🌿 Species    : {species.upper()}")
print(f"   📈 Confidence : {confidence * 100:.2f}%")
print("\n   📋 All scores:")
for i, score in enumerate(preds[0]):
    name  = class_names[str(i)]
    bar   = "█" * int(score * 30)
    print(f"   {name:<12} {score*100:5.2f}%  {bar}")
print("══════════════════════════════════\n")
