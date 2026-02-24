from flask import Flask, request, jsonify
import joblib
import numpy as np
import pandas as pd
from flask_cors import CORS
import os
from flask import Flask, request, send_file
from io import BytesIO
from fpdf import FPDF
from datetime import datetime

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
# Prediction helpers + Routes
# ===============================

def run_model(data: dict) -> dict:
    """Run feature build + model ensemble and return a plain dict (not a Response)."""
    try:
        df = build_features(data)
        df_imp = imputer.transform(df)

        rf_prob = float(rf.predict_proba(df_imp)[0][1])
        xgb_prob = float(xgb.predict(df_imp)[0])
        xgb_prob = max(0.0, min(1.0, xgb_prob))

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

        return {
            "prediction": prediction,
            "confidence": round(final_prob * 100, 2),
            "rf_confidence": round(rf_prob * 100, 2),
            "xgb_confidence": round(xgb_prob * 100, 2),
            "threshold": THRESHOLD,
            "risk_factors": risk_factors,
            "critical_factors": critical_factors,
            "moderate_factors": moderate_factors,
            "lifestyle_factors": lifestyle_factors
        }
    except Exception as e:
        print("[ERROR]", str(e))
        return {"error": str(e)}

def generate_pdf(data: dict) -> bytes:
    result = run_model(data)

    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    # Use default safe font (latin-1)
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "Coronary Artery Disease (CAD) Health Report", ln=True, align="C")

    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 8, "AI-Based Heart Disease Risk Assessment", ln=True, align="C")

    pdf.ln(4)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(8)

    # =========================
    # SUMMARY
    # =========================
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 8, "Prediction Summary", ln=True)
    pdf.ln(3)

    pdf.set_font("Helvetica", "", 11)

    pred_text = "POSITIVE" if result.get("prediction") == 1 else "NEGATIVE"
    confidence = result.get("confidence", 0)

    pdf.cell(0, 8, f"Prediction Result : {pred_text}", ln=True)
    pdf.cell(0, 8, f"Model Confidence  : {confidence} %", ln=True)
    pdf.cell(0, 8, f"Decision Threshold: {result.get('threshold')}", ln=True)

    pdf.ln(6)

    # =========================
    # RISK FACTORS
    # =========================
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 8, "Identified Risk Factors", ln=True)
    pdf.ln(3)

    pdf.set_font("Helvetica", "", 11)

    risk_factors = result.get("risk_factors", [])

    if not risk_factors:
        pdf.cell(0, 8, "No major risk factors identified.", ln=True)
    else:
        for factor in risk_factors:
            # Sanitize ALL unicode characters
            safe_factor = (
                factor
                .replace("–", "-")
                .replace("—", "-")
                .replace("≥", ">=")
                .replace("•", "-")
            )
            pdf.multi_cell(0, 7, f"- {safe_factor}")

    pdf.ln(6)

    # =========================
    # DISCLAIMER
    # =========================
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Medical Disclaimer", ln=True)
    pdf.ln(2)

    pdf.set_font("Helvetica", "", 9)
    pdf.multi_cell(
        0,
        6,
        "This report is generated using a machine learning model and is intended "
        "for informational purposes only. It does not constitute medical advice. "
        "Please consult a qualified healthcare professional for diagnosis and treatment."
    )

    # =========================
    # FOOTER
    # =========================
    pdf.ln(8)
    pdf.set_font("Helvetica", "I", 8)
    pdf.cell(
        0,
        6,
        f"Report generated on: {datetime.now().strftime('%d %b %Y, %I:%M %p')}",
        ln=True,
        align="R"
    )

    # IMPORTANT: latin-1 safe output
    return pdf.output(dest="S").encode("latin-1")
@app.post("/predict")
def predict():
    data = request.json
    result = run_model(data)
    return result  # JSON ONLY


@app.post("/predict/pdf")
def predict_pdf():
    data = request.json

    pdf_bytes = generate_pdf(data)  # MUST be bytes

    return send_file(
        BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name="health-report.pdf"
    )

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
