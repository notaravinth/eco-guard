import subprocess
import sys
import os

# Install tensorflowjs if not present
subprocess.check_call([sys.executable, "-m", "pip", "install", "tensorflowjs", "tensorflow", "-q"])

import tensorflowjs as tfjs
import tensorflow as tf

h5_path = os.path.join(os.path.dirname(__file__), "models", "ecoguard_plant_model_final.h5")
output_path = os.path.join(os.path.dirname(__file__), "model")

print(f"Loading model from: {h5_path}")
model = tf.keras.models.load_model(h5_path)
model.summary()

print(f"\nConverting to TF.js format → {output_path}")
tfjs.converters.save_keras_model(model, output_path)
print("✅ Conversion complete!")
