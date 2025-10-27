from flask import Flask, request, jsonify
import pickle
import numpy as np
import pandas as pd
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow frontend to talk to backend

# ============ LOAD MODEL ============
with open("logistic_model.pkl", "rb") as f:
    model_data = pickle.load(f)

model = model_data["model"]
scaler = model_data["scaler"]
feature_names = model_data["features"]

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        print("[DEBUG] Received:", data)

        # Ensure all features are present
        input_data = [data.get(f, 0) for f in feature_names]
        df = pd.DataFrame([input_data], columns=feature_names)
        scaled_input = scaler.transform(df)

        pred = model.predict(scaled_input)[0]
        prob = model.predict_proba(scaled_input)[0][1]

        result = {
            "prediction": int(pred),
            "confidence": round(float(prob) * 100, 2)
        }
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/")
def home():
    return "<h2>🩺 Heart Disease Prediction API is running successfully!</h2><p>Use POST /predict to make predictions.</p>"

if __name__ == "__main__":
    app.run(debug=True)
