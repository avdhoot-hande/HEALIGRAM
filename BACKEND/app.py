from flask import Flask, request, jsonify
import joblib
import numpy as np
import pandas as pd
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# ===============================
# Load Model Package
# ===============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "heart_disease_ensemble_pro.pkl")

model_data = joblib.load(MODEL_PATH)

rf = model_data["models"]["random_forest"]
xgb = model_data["models"]["xgb_calibrated"]  # treated as probability regressor
imputer = model_data["imputer"]
FEATURE_COLUMNS = model_data["features"]
THRESHOLD = model_data["threshold"]

print("✅ Model loaded successfully")
print("Expected features:", FEATURE_COLUMNS)
print("XGB model type:", type(xgb))

# ===============================
# Feature Engineering (SAME AS TRAINING)
# ===============================
def build_features(data: dict) -> pd.DataFrame:
    df = pd.DataFrame([data])

    # Age in years
    df["age"] = df["age"] / 365.25 if df["age"].max() > 120 else df["age"]

    # Age groups
    df["age_group"] = pd.cut(
        df["age"],
        bins=[0, 40, 50, 60, 70, 120],
        labels=["<40", "40-50", "50-60", "60-70", "70+"]
    )
    df = pd.get_dummies(df, columns=["age_group"], drop_first=True)

    # BMI
    df["bmi"] = df["weight"] / ((df["height"] / 100) ** 2)

    df["bmi_category"] = pd.cut(
        df["bmi"],
        bins=[0, 18.5, 25, 30, 100],
        labels=["underweight", "normal", "overweight", "obese"]
    )
    df = pd.get_dummies(df, columns=["bmi_category"], drop_first=True)

    # Pulse pressure
    df["pulse_pressure"] = df["ap_hi"] - df["ap_lo"]

    # Hypertension stage
    df["hypertension_stage"] = 0
    df.loc[(df["ap_hi"] >= 140) | (df["ap_lo"] >= 90), "hypertension_stage"] = 1
    df.loc[(df["ap_hi"] >= 160) | (df["ap_lo"] >= 100), "hypertension_stage"] = 2

    # Interaction features
    df["age_bmi_interaction"] = df["age"] * df["bmi"]
    df["bp_pulse_interaction"] = df["pulse_pressure"] * df["ap_hi"]

    # Align feature columns
    for col in FEATURE_COLUMNS:
        if col not in df.columns:
            df[col] = 0

    df = df[FEATURE_COLUMNS]
    return df

# ===============================
# Prediction Route
# ===============================
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        print("[DEBUG] Received:", data)

        df = build_features(data)
        df_imp = imputer.transform(df)

        # Random Forest probability
        rf_prob = float(rf.predict_proba(df_imp)[0][1])

        # XGBoost output treated as probability
        xgb_prob = float(xgb.predict(df_imp)[0])

        # Clamp for safety
        xgb_prob = max(0.0, min(1.0, xgb_prob))

        # Ensemble
        final_prob = (0.4 * rf_prob) + (0.6 * xgb_prob)
        prediction = int(final_prob >= THRESHOLD)

        # Risk factor analysis
        critical_factors = []
        moderate_factors = []
        lifestyle_factors = []

        age_years = data["age"] / 365.25

        if data["ap_hi"] >= 140 or data["ap_lo"] >= 90:
            critical_factors.append("High blood pressure")

        if age_years > 50:
            critical_factors.append("Age above 50")

        if data.get("cholesterol", 1) > 1:
            critical_factors.append("High cholesterol")

        if data.get("smoke", 0) == 1:
            critical_factors.append("Smoking")

        bmi = data["weight"] / ((data["height"] / 100) ** 2)
        if bmi >= 30:
            moderate_factors.append("Obesity (BMI ≥ 30)")
        elif bmi >= 25:
            moderate_factors.append("Overweight (BMI 25–29.9)")

        if data.get("gluc", 1) > 1:
            moderate_factors.append("High blood glucose")

        if data.get("alco", 0) == 1:
            moderate_factors.append("Alcohol consumption")

        if data.get("active", 1) == 0:
            lifestyle_factors.append("Physical inactivity")

        risk_factors = critical_factors + moderate_factors + lifestyle_factors

        return jsonify({
            "prediction": prediction,
            "confidence": round(final_prob * 100, 2),
            "rf_confidence": round(rf_prob * 100, 2),
            "xgb_confidence": round(xgb_prob * 100, 2),
            "threshold": THRESHOLD,
            "risk_factors": risk_factors,
            "critical_factors": critical_factors,
            "moderate_factors": moderate_factors,
            "lifestyle_factors": lifestyle_factors
        })

    except Exception as e:
        print("[ERROR]", str(e))
        return jsonify({"error": str(e)}), 400

# ===============================
# Health Check
# ===============================
@app.route("/")
def home():
    return {
        "status": "🩺 Heart Disease Prediction API running",
        "models": ["Random Forest", "XGBoost (Probability Model)"]
    }

# ===============================
# Run Server
# ===============================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
