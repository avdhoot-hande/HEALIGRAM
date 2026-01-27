from flask import Flask, request, jsonify
import joblib
import numpy as np
import pandas as pd
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# ===============================
# Load Model Package (JOBLIB)
# ===============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "heart_disease_xgb_ensemble_v2.pkl")

model_data = joblib.load(MODEL_PATH)

rf = model_data["models"]["random_forest"]
xgb = model_data["models"]["xgboost"]
imputer = model_data["imputer"]
scaler = model_data["scaler"]
feature_names = model_data["features"]
threshold = model_data["threshold"]

print("✅ Model loaded successfully")
print("Expected features:", feature_names)

# ===============================
# Prediction Route
# ===============================
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        print("[DEBUG] Received:", data)

        # Build input row with strict numeric casting
        input_row = {}
        for f in feature_names:
            if f not in data:
                raise ValueError(f"Missing feature: {f}")
            input_row[f] = float(data[f])  # 🔥 FORCE numeric

        df = pd.DataFrame([input_row])[feature_names]
        print("[DEBUG] Input DF:\n", df)

        # Preprocessing
        df_imputed = imputer.transform(df)
        df_scaled = scaler.transform(df_imputed)

        # Predictions
        rf_prob = rf.predict_proba(df_scaled)[0][1]
        xgb_prob = xgb.predict_proba(df_imputed)[0][1]

        final_prob = (0.4 * rf_prob) + (0.6 * xgb_prob)
        prediction = int(final_prob >= threshold)

        return jsonify({
            "prediction": int(prediction),
            "confidence": round(float(final_prob) * 100, 2),
            "rf_confidence": round(float(rf_prob) * 100, 2),
            "xgb_confidence": round(float(xgb_prob) * 100, 2),
            "threshold": float(threshold)
        })


    except Exception as e:
        print("[ERROR]", str(e))  # 🔥 IMPORTANT
        return jsonify({
            "error": str(e),
            "expected_features": feature_names
        }), 400

# ===============================
# Health Check
# ===============================
@app.route("/")
def home():
    return {
        "status": "🩺 Heart Disease Prediction API running",
        "models": ["Random Forest", "XGBoost"]
    }

# ===============================
# Run Server
# ===============================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
