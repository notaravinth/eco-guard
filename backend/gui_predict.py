import tkinter as tk
from tkinter import filedialog, ttk
from PIL import Image, ImageTk
import tensorflow as tf
import numpy as np
import json
import os
import threading

# ── Paths ──────────────────────────────────────────────────────────────
BASE    = os.path.dirname(os.path.abspath(__file__))
MODEL   = os.path.join(BASE, "models", "ecoguard_plant_model.h5")  # Try the other model file
CLASSES = os.path.join(BASE, "models", "class_names.json")

with open(CLASSES) as f:
    class_names = json.load(f)

# ── Load model in background so GUI opens instantly ────────────────────
model = None

def load_model_bg():
    global model
    app.status_var.set("⏳ Loading model, please wait...")
    model = tf.keras.models.load_model(MODEL, compile=False)
    app.status_var.set("✅ Model ready! Upload an image to predict.")
    app.upload_btn.config(state="normal")

# ── Main App ───────────────────────────────────────────────────────────
class EcoGuardApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("🌿 EcoGuard — Invasive Plant Detector")
        self.geometry("600x800")
        self.resizable(True, True)
        self.configure(bg="#1e1e2e")
        self._build_ui()

    def _build_ui(self):
        # Title
        tk.Label(self, text="🌿 EcoGuard", font=("Helvetica", 20, "bold"),
                 bg="#1e1e2e", fg="#a6e3a1").pack(pady=(10, 2))
        tk.Label(self, text="Invasive Plant Species Detector",
                 font=("Helvetica", 10), bg="#1e1e2e", fg="#cdd6f4").pack()

        # Image preview box
        self.img_frame = tk.Frame(self, bg="#313244", width=280, height=260,
                                  relief="flat")
        self.img_frame.pack(pady=10)
        self.img_frame.pack_propagate(False)
        self.img_label = tk.Label(self.img_frame, text="No image uploaded",
                                  bg="#313244", fg="#6c7086",
                                  font=("Helvetica", 11))
        self.img_label.pack(expand=True)

        # Upload button
        self.upload_btn = tk.Button(
            self, text="📂  Upload Image", font=("Helvetica", 12, "bold"),
            bg="#89b4fa", fg="#1e1e2e", activebackground="#74c7ec",
            relief="flat", padx=20, pady=10, cursor="hand2",
            command=self.upload_image, state="disabled"
        )
        self.upload_btn.pack(pady=3)

        # Status bar
        self.status_var = tk.StringVar(value="Initializing...")
        tk.Label(self, textvariable=self.status_var, bg="#1e1e2e",
                 fg="#fab387", font=("Helvetica", 10, "italic")).pack(pady=5)

        # Result box
        result_frame = tk.Frame(self, bg="#313244", bd=0)
        result_frame.pack(fill="x", padx=30, pady=5)

        tk.Label(result_frame, text="Prediction Result",
                 font=("Helvetica", 11, "bold"), bg="#313244",
                 fg="#cdd6f4").pack(anchor="w", padx=15, pady=(10,0))

        self.species_var = tk.StringVar(value="—")
        tk.Label(result_frame, textvariable=self.species_var,
                 font=("Helvetica", 20, "bold"), bg="#313244",
                 fg="#a6e3a1").pack(anchor="w", padx=15)

        self.conf_var = tk.StringVar(value="")
        tk.Label(result_frame, textvariable=self.conf_var,
                 font=("Helvetica", 10), bg="#313244",
                 fg="#cdd6f4").pack(anchor="w", padx=15, pady=(0, 5))

        # Score bars
        self.bar_frame = tk.Frame(result_frame, bg="#313244")
        self.bar_frame.pack(fill="x", padx=15, pady=(5, 15))

        self.bars = {}
        colors = {"lantana": "#f38ba8", "native": "#a6e3a1",
                  "parthenium": "#f9e2af", "prosopis": "#89dceb"}
        for i in range(len(class_names)):
            name = class_names[str(i)]
            row  = tk.Frame(self.bar_frame, bg="#313244")
            row.pack(fill="x", pady=2)
            tk.Label(row, text=name.capitalize(), width=12, anchor="w",
                     bg="#313244", fg="#cdd6f4",
                     font=("Helvetica", 9)).pack(side="left")
            bar_bg = tk.Frame(row, bg="#45475a", height=16, width=280)
            bar_bg.pack(side="left")
            bar_bg.pack_propagate(False)
            bar_fill = tk.Frame(bar_bg, bg=colors.get(name, "#89b4fa"),
                                height=16, width=0)
            bar_fill.place(x=0, y=0, relheight=1)
            pct_lbl = tk.Label(row, text="0%", bg="#313244", fg="#cdd6f4",
                               font=("Helvetica", 9), width=6)
            pct_lbl.pack(side="left", padx=4)
            self.bars[name] = (bar_fill, pct_lbl, bar_bg)

    # ── Upload & Predict ───────────────────────────────────────────────
    def upload_image(self):
        path = filedialog.askopenfilename(
            title="Select Plant Image",
            filetypes=[("Image files", "*.jpg *.jpeg *.png *.bmp *.webp")]
        )
        if not path:
            return

        # Show preview
        img = Image.open(path).convert("RGB")
        preview = img.copy()
        preview.thumbnail((300, 300))
        photo = ImageTk.PhotoImage(preview)
        self.img_label.configure(image=photo, text="")
        self.img_label.image = photo

        # Predict in background thread so UI stays responsive
        self.status_var.set("⏳ Predicting...")
        self.upload_btn.config(state="disabled")
        threading.Thread(target=self._predict, args=(img,),
                         daemon=True).start()

    def _predict(self, img):
        arr  = np.array(img.resize((224, 224))) / 255.0
        arr  = np.expand_dims(arr, axis=0)
        pred = model.predict(arr, verbose=0)[0]
        idx  = int(np.argmax(pred))

        self.after(0, self._show_results, pred, idx)

    def _show_results(self, pred, idx):
        species    = class_names[str(idx)]
        confidence = pred[idx] * 100

        self.species_var.set(f"🌿  {species.capitalize()}")

        # ✅ Show realistic confidence label with warning if too high
        if confidence >= 99.9:
            self.conf_var.set(f"Confidence: {confidence:.2f}%  ⚠️ Model very certain (check if image is clear)")
        elif confidence >= 80:
            self.conf_var.set(f"Confidence: {confidence:.2f}%  ✅ High confidence")
        elif confidence >= 50:
            self.conf_var.set(f"Confidence: {confidence:.2f}%  🟡 Moderate confidence")
        else:
            self.conf_var.set(f"Confidence: {confidence:.2f}%  🔴 Low confidence — try a clearer image")
        self.status_var.set("✅ Prediction complete!")
        self.upload_btn.config(state="normal")

        # Update bars
        for i, score in enumerate(pred):
            name = class_names[str(i)]
            fill, lbl, bg = self.bars[name]
            max_w = 280
            w = int(score * max_w)
            fill.place(x=0, y=0, relheight=1, width=w)
            lbl.config(text=f"{score*100:.1f}%")

# ── Entry ──────────────────────────────────────────────────────────────
app = EcoGuardApp()
threading.Thread(target=load_model_bg, daemon=True).start()
app.mainloop()
