from flask import Flask, request, jsonify, send_file
import joblib
import numpy as np
import pandas as pd
from flask_cors import CORS
import os
from io import BytesIO
from fpdf import FPDF
from datetime import datetime

# ===============================
# ECG MODEL IMPORTS
# ===============================
import torch
import torchvision
from torch import nn
import cv2

app = Flask(__name__)
CORS(app)

# ===============================
# Load Tabular Model Package
# ===============================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "heart_disease_ensemble_pro.pkl")

model_data = joblib.load(MODEL_PATH)

rf = model_data["models"]["random_forest"]
xgb = model_data["models"]["xgb_calibrated"]
imputer = model_data["imputer"]
FEATURE_COLUMNS = model_data["features"]
THRESHOLD = model_data["threshold"]

print("✅ Tabular model loaded")

# ===============================
# LOAD ECG CNN MODEL
# ===============================

# ⚠ FIX: renamed to match your actual saved file
ECG_MODEL_PATH = os.path.join(BASE_DIR, "ecg_cad_model.pth")

ECG_LABELS = {
    0: "Normal ECG",
    1: "Myocardial Infarction",
    2: "Abnormal Heartbeat",
}

ecg_model = None

if os.path.exists(ECG_MODEL_PATH):
    try:
        ecg_model = torchvision.models.resnet18()
        ecg_model.fc = nn.Linear(ecg_model.fc.in_features, 3)
        ecg_model.load_state_dict(
            torch.load(ECG_MODEL_PATH, map_location="cpu")
        )
        ecg_model.eval()
        print("✅ ECG CNN loaded from:", ECG_MODEL_PATH)
    except Exception as e:
        print(f"❌ Failed to load ECG model: {e}")
        ecg_model = None
else:
    print(f"⚠ ECG model not found at: {ECG_MODEL_PATH}")
    print("  → To fix: save your trained model with torch.save(model.state_dict(), 'ecg_cad_model.pth')")


# ===============================
# ECG IMAGE PREPROCESS
# ===============================

def preprocess_ecg_image(file):
    file_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image. Make sure it is a valid PNG/JPG ECG image.")
    img = cv2.resize(img, (224, 224))
    img = img / 255.0
    img = np.transpose(img, (2, 0, 1))
    img = torch.tensor(img).float().unsqueeze(0)
    return img


# ===============================
# ECG FULL PREDICTION (probs + label)
# ===============================

def predict_ecg_full(image_file):
    """Returns dict with prediction, label, confidence, probabilities."""
    if ecg_model is None:
        raise RuntimeError(
            "ECG model is not loaded. "
            "Please save your trained model with: torch.save(model.state_dict(), 'ecg_cad_model.pth')"
        )

    img = preprocess_ecg_image(image_file)

    with torch.no_grad():
        output = ecg_model(img)
        probs = torch.softmax(output, dim=1).numpy()[0]

    prediction = int(np.argmax(probs))
    confidence = float(probs[prediction]) * 100

    return {
        "prediction": prediction,
        "label": ECG_LABELS[prediction],
        "confidence": round(confidence, 2),
        "probabilities": {
            "normal":   round(float(probs[0]), 4),
            "mi":       round(float(probs[1]), 4),
            "abnormal": round(float(probs[2]), 4),
        },
        "ecg_confidence": round(confidence, 2),
    }


def predict_ecg_risk_score(image_file):
    """Returns a single float risk score for blending with tabular model."""
    try:
        result = predict_ecg_full(image_file)
        p = result["probabilities"]
        return (p["mi"] * 1.0) + (p["abnormal"] * 0.7)
    except Exception as e:
        print("ECG risk score error:", e)
        return None


# ===============================
# Feature Engineering (tabular)
# ===============================

def build_features(data: dict) -> pd.DataFrame:
    df = pd.DataFrame([data])
    df["age"] = df["age"] / 365.25 if df["age"].max() > 120 else df["age"]
    df["age_group"] = pd.cut(
        df["age"],
        bins=[0, 40, 50, 60, 70, 120],
        labels=["<40", "40-50", "50-60", "60-70", "70+"]
    )
    df = pd.get_dummies(df, columns=["age_group"], drop_first=True)
    df["bmi"] = df["weight"] / ((df["height"] / 100) ** 2)
    df["bmi_category"] = pd.cut(
        df["bmi"],
        bins=[0, 18.5, 25, 30, 100],
        labels=["underweight", "normal", "overweight", "obese"]
    )
    df = pd.get_dummies(df, columns=["bmi_category"], drop_first=True)
    df["pulse_pressure"] = df["ap_hi"] - df["ap_lo"]
    df["hypertension_stage"] = 0
    df.loc[(df["ap_hi"] >= 140) | (df["ap_lo"] >= 90), "hypertension_stage"] = 1
    df.loc[(df["ap_hi"] >= 160) | (df["ap_lo"] >= 100), "hypertension_stage"] = 2
    df["age_bmi_interaction"] = df["age"] * df["bmi"]
    df["bp_pulse_interaction"] = df["pulse_pressure"] * df["ap_hi"]
    for col in FEATURE_COLUMNS:
        if col not in df.columns:
            df[col] = 0
    df = df[FEATURE_COLUMNS]
    return df


# ===============================
# TABULAR + ECG COMBINED PREDICTION
# ===============================

def run_model(data: dict, ecg_file=None) -> dict:
    try:
        df = build_features(data)
        df_imp = imputer.transform(df)

        rf_prob = float(rf.predict_proba(df_imp)[0][1])
        xgb_prob = float(xgb.predict(df_imp)[0])
        xgb_prob = max(0.0, min(1.0, xgb_prob))
        tabular_prob = (0.4 * rf_prob) + (0.6 * xgb_prob)

        ecg_prob = None
        if ecg_file:
            ecg_prob = predict_ecg_risk_score(ecg_file)

        if ecg_prob is not None:
            final_prob = (0.6 * tabular_prob) + (0.4 * ecg_prob)
        else:
            final_prob = tabular_prob

        prediction = int(final_prob >= THRESHOLD)

        # Risk factors
        critical_factors, moderate_factors, lifestyle_factors = [], [], []
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
            moderate_factors.append("Obesity (BMI >= 30)")
        elif bmi >= 25:
            moderate_factors.append("Overweight (BMI 25–29.9)")
        if data.get("gluc", 1) > 1:
            moderate_factors.append("High blood glucose")
        if data.get("alco", 0) == 1:
            moderate_factors.append("Alcohol consumption")
        if data.get("active", 1) == 0:
            lifestyle_factors.append("Physical inactivity")

        return {
            "prediction": prediction,
            "confidence": round(final_prob * 100, 2),
            "rf_confidence": round(rf_prob * 100, 2),
            "xgb_confidence": round(xgb_prob * 100, 2),
            "ecg_confidence": None if ecg_prob is None else round(ecg_prob * 100, 2),
            "threshold": THRESHOLD,
            "risk_factors": critical_factors + moderate_factors + lifestyle_factors,
            "critical_factors": critical_factors,
            "moderate_factors": moderate_factors,
            "lifestyle_factors": lifestyle_factors,
        }

    except Exception as e:
        print("[ERROR]", str(e))
        return {"error": str(e)}


# ===============================
# API ROUTES — EXISTING
# ===============================

@app.post("/predict")
def predict():
    if request.content_type.startswith("multipart/form-data"):
        data = dict(request.form)
        for k in data:
            data[k] = float(data[k])
        ecg_file = request.files.get("ecg")
    else:
        data = request.json
        ecg_file = None
    result = run_model(data, ecg_file)
    return jsonify(result)


# ===============================
# NEW: STANDALONE ECG ENDPOINT
# ===============================

@app.post("/predict-ecg")
def predict_ecg_endpoint():
    """
    Standalone ECG-only prediction.
    Accepts multipart/form-data with an 'ecg' image file.
    Returns prediction, label, confidence, and per-class probabilities.
    """
    ecg_file = request.files.get("ecg")

    if not ecg_file:
        return jsonify({"error": "No ECG image provided. Send as multipart field 'ecg'."}), 400

    try:
        result = predict_ecg_full(ecg_file)
        return jsonify(result)
    except RuntimeError as e:
        # Model not loaded
        return jsonify({"error": str(e)}), 503
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500


# ===============================
# NEW: ECG PDF REPORT
# ===============================

@app.post("/predict-ecg/pdf")
def ecg_pdf():
    """
    Generate a PDF report for an ECG result.
    Accepts JSON body with the result from /predict-ecg.
    """
    data = request.json or {}

    prediction = data.get("prediction", 0)
    label = data.get("label", ECG_LABELS.get(prediction, "Unknown"))
    confidence = data.get("confidence", 0)
    probs = data.get("probabilities", {})
    filename = data.get("filename", "Unknown")
    timestamp = data.get("timestamp", datetime.now().isoformat())

    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    # Title
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 12, "ECG Analysis Report", ln=True, align="C")

    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 8, "AI-Based ECG Neural Analysis — Healigram", ln=True, align="C")
    pdf.ln(4)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(8)

    # Date & file
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 7, f"Report generated : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ln=True)
    pdf.cell(0, 7, f"ECG file         : {filename}", ln=True)
    pdf.ln(6)

    # Result
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 9, "Prediction Result", ln=True)
    pdf.ln(2)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 8, f"Diagnosis  : {label}", ln=True)
    pdf.cell(0, 8, f"Confidence : {confidence:.1f}%", ln=True)
    pdf.ln(6)

    # Probabilities
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(0, 9, "Class Probabilities", ln=True)
    pdf.ln(2)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 8, f"Normal ECG             : {probs.get('normal', 0)*100:.1f}%", ln=True)
    pdf.cell(0, 8, f"Myocardial Infarction  : {probs.get('mi', 0)*100:.1f}%", ln=True)
    pdf.cell(0, 8, f"Abnormal Heartbeat     : {probs.get('abnormal', 0)*100:.1f}%", ln=True)
    pdf.ln(6)

    # Disclaimer
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(5)
    pdf.set_font("Helvetica", "I", 9)
    pdf.multi_cell(0, 6,
        "DISCLAIMER: This report is generated by an AI model and is intended for informational "
        "purposes only. It does not constitute a medical diagnosis. Please consult a qualified "
        "cardiologist or healthcare professional for medical advice."
    )

    pdf_bytes = pdf.output(dest="S").encode("latin-1")

    return send_file(
        BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name="ecg-report.pdf"
    )


# ===============================
# PDF — EXISTING TABULAR ROUTE
# ===============================

def get_risk_tier(prediction: int, confidence: float) -> str:
    """Mirror the frontend 3-tier logic."""
    if prediction == 0:
        return "LOW"
    return "HIGH" if confidence >= 85 else "MODERATE"


def draw_section_header(pdf: FPDF, title: str):
    """Draw a filled section header bar."""
    pdf.set_fill_color(30, 30, 40)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 8, f"  {title}", ln=True, fill=True)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(3)


def draw_kv_row(pdf: FPDF, key: str, value: str, shade: bool = False):
    """Draw a key-value row with optional alternating shade."""
    if shade:
        pdf.set_fill_color(245, 245, 248)
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(70, 7, key, fill=True)
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(0, 7, value, ln=True, fill=True)
        pdf.set_fill_color(255, 255, 255)
    else:
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(70, 7, key)
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(0, 7, value, ln=True)


def draw_progress_bar(pdf: FPDF, label: str, value: float, max_val: float = 100,
                      r: int = 41, g: int = 128, b: int = 185):
    """Draw a labelled horizontal progress bar."""
    bar_x = pdf.get_x()
    bar_y = pdf.get_y()
    bar_w = 130
    bar_h = 4
    fill_w = (value / max_val) * bar_w

    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(55, 7, label)

    # Background track
    pdf.set_fill_color(220, 220, 220)
    pdf.rect(pdf.get_x(), bar_y + 1.5, bar_w, bar_h, "F")

    # Fill
    pdf.set_fill_color(r, g, b)
    if fill_w > 0:
        pdf.rect(pdf.get_x(), bar_y + 1.5, fill_w, bar_h, "F")

    # Value text
    pdf.set_xy(pdf.get_x() + bar_w + 3, bar_y)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(20, 7, f"{value:.1f}%", ln=True)


def draw_factor_chips(pdf: FPDF, factors: list, r: int, g: int, b: int):
    """Draw factor tags inline."""
    if not factors:
        pdf.set_font("Helvetica", "I", 9)
        pdf.set_text_color(160, 160, 160)
        pdf.cell(0, 6, "  None identified", ln=True)
        pdf.set_text_color(0, 0, 0)
        return

    pdf.set_font("Helvetica", "", 9)
    for f in factors:
        pdf.set_fill_color(r, g, b)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(len(f) * 2.2 + 6, 6, f"  {f}  ", ln=False, fill=True, border=0)
        pdf.cell(3, 6, "", ln=False)  # gap
    pdf.ln(8)
    pdf.set_text_color(0, 0, 0)


def generate_pdf(data: dict) -> bytes:
    result = run_model(data)

    prediction   = result.get("prediction", 0)
    confidence   = result.get("confidence", 0)
    rf_conf      = result.get("rf_confidence", 0)
    xgb_conf     = result.get("xgb_confidence", 0)
    ecg_conf     = result.get("ecg_confidence")
    critical     = result.get("critical_factors", [])
    moderate_f   = result.get("moderate_factors", [])
    lifestyle    = result.get("lifestyle_factors", [])
    tier         = get_risk_tier(prediction, confidence)

    # Display confidence (flip for Low Risk to show "healthy confidence")
    display_conf = (100 - confidence) if prediction == 0 else confidence

    age_years    = round(data.get("age", 0) / 365.25)
    bmi          = data["weight"] / ((data["height"] / 100) ** 2)
    gender_text  = "Male" if data.get("gender", 1) == 1 else "Female"
    chol_map     = {1: "Normal", 2: "Above Normal", 3: "High"}
    gluc_map     = {1: "Normal", 2: "Above Normal", 3: "High"}

    TIER_COLORS = {
        "LOW":      (39, 174, 96),
        "MODERATE": (230, 126, 34),
        "HIGH":     (192, 57, 43),
    }
    tr, tg, tb = TIER_COLORS[tier]

    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.set_margins(15, 15, 15)

    # ── HEADER BANNER ──────────────────────────────────────────────
    pdf.set_fill_color(18, 18, 28)
    pdf.rect(0, 0, 210, 38, "F")

    pdf.set_xy(15, 8)
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(140, 10, "Healigram Health Report", ln=False)

    # Tier badge (top right)
    pdf.set_fill_color(tr, tg, tb)
    pdf.set_xy(155, 10)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(40, 8, f"  {tier} RISK  ", fill=True, align="C")

    pdf.set_xy(15, 22)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(180, 180, 200)
    pdf.cell(0, 6, f"Coronary Artery Disease (CAD) Risk Assessment   |   Generated: {datetime.now().strftime('%d %b %Y, %H:%M')}")

    pdf.set_text_color(0, 0, 0)
    pdf.ln(26)

    # ── SECTION 1: DIAGNOSIS SUMMARY ──────────────────────────────
    draw_section_header(pdf, "1.  DIAGNOSIS SUMMARY")

    pred_text = "CAD POSITIVE" if prediction == 1 else "CAD NEGATIVE"
    advice = {
        "LOW":      "Maintain a healthy lifestyle. Routine annual checkups are recommended.",
        "MODERATE": "Consider lifestyle improvements and consult a doctor for a full cardiac workup.",
        "HIGH":     "Seek prompt medical evaluation. Immediate cardiology consultation is strongly recommended.",
    }[tier]

    draw_kv_row(pdf, "Diagnosis Result",  pred_text, shade=True)
    draw_kv_row(pdf, "Risk Tier",         f"{tier} RISK", shade=False)
    draw_kv_row(pdf, "Model Confidence",  f"{display_conf:.1f}%", shade=True)
    draw_kv_row(pdf, "Clinical Advice",   advice, shade=False)
    pdf.ln(4)

    # ── SECTION 2: PATIENT BIOMETRICS ─────────────────────────────
    draw_section_header(pdf, "2.  PATIENT BIOMETRICS")

    draw_kv_row(pdf, "Age",               f"{age_years} years", shade=True)
    draw_kv_row(pdf, "Gender",            gender_text, shade=False)
    draw_kv_row(pdf, "Height",            f"{int(data.get('height', 0))} cm", shade=True)
    draw_kv_row(pdf, "Weight",            f"{int(data.get('weight', 0))} kg", shade=False)
    draw_kv_row(pdf, "BMI",               f"{bmi:.1f} kg/m²", shade=True)
    draw_kv_row(pdf, "Systolic BP",       f"{int(data.get('ap_hi', 0))} mmHg", shade=False)
    draw_kv_row(pdf, "Diastolic BP",      f"{int(data.get('ap_lo', 0))} mmHg", shade=True)
    draw_kv_row(pdf, "Cholesterol Level", chol_map.get(int(data.get("cholesterol", 1)), "Normal"), shade=False)
    draw_kv_row(pdf, "Glucose Level",     gluc_map.get(int(data.get("gluc", 1)), "Normal"), shade=True)
    draw_kv_row(pdf, "Smoking",           "Yes" if data.get("smoke", 0) == 1 else "No", shade=False)
    draw_kv_row(pdf, "Alcohol",           "Yes" if data.get("alco", 0) == 1 else "No", shade=True)
    draw_kv_row(pdf, "Physically Active", "Yes" if data.get("active", 1) == 1 else "No", shade=False)
    pdf.ln(4)

    # ── SECTION 3: MODEL CONFIDENCE BREAKDOWN ─────────────────────
    draw_section_header(pdf, "3.  MODEL CONFIDENCE BREAKDOWN")

    draw_progress_bar(pdf, "Random Forest",      rf_conf,  r=41,  g=128, b=185)
    draw_progress_bar(pdf, "XGBoost",            xgb_conf, r=142, g=68,  b=173)
    if ecg_conf is not None:
        draw_progress_bar(pdf, "ECG CNN (ResNet18)", ecg_conf, r=39, g=174, b=96)
    draw_progress_bar(pdf, "Fused Confidence",   display_conf, r=tr, g=tg, b=tb)
    pdf.ln(4)

    # ── SECTION 4: RISK FACTORS ────────────────────────────────────
    draw_section_header(pdf, "4.  RISK FACTORS")

    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(192, 57, 43)
    pdf.cell(0, 6, "  Critical", ln=True)
    pdf.set_text_color(0, 0, 0)
    pdf.set_x(15)
    draw_factor_chips(pdf, critical, 192, 57, 43)

    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(230, 126, 34)
    pdf.cell(0, 6, "  Moderate", ln=True)
    pdf.set_text_color(0, 0, 0)
    pdf.set_x(15)
    draw_factor_chips(pdf, moderate_f, 230, 126, 34)

    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(41, 128, 185)
    pdf.cell(0, 6, "  Lifestyle", ln=True)
    pdf.set_text_color(0, 0, 0)
    pdf.set_x(15)
    draw_factor_chips(pdf, lifestyle, 41, 128, 185)
    pdf.ln(4)

    # ── SECTION 5: RECOMMENDATIONS ────────────────────────────────
    draw_section_header(pdf, "5.  RECOMMENDATIONS")

    recommendations = {
        "LOW": [
            "Continue regular physical activity (150+ min/week moderate exercise).",
            "Maintain a balanced diet rich in vegetables, fruits, and whole grains.",
            "Schedule a routine cardiac checkup annually.",
            "Monitor blood pressure and cholesterol levels periodically.",
        ],
        "MODERATE": [
            "Consult your physician for a comprehensive cardiovascular evaluation.",
            "Target blood pressure below 130/80 mmHg through diet and medication if needed.",
            "Adopt a heart-healthy diet — reduce saturated fats, sodium, and processed foods.",
            "Engage in regular aerobic exercise (at least 30 min, 5 days/week).",
            "If smoking, seek cessation support immediately.",
            "Schedule a stress test and lipid profile with your cardiologist.",
        ],
        "HIGH": [
            "Seek immediate medical evaluation from a cardiologist.",
            "Do not delay — arrange an urgent appointment or visit a cardiac centre.",
            "Bring this report to your physician for review.",
            "Avoid strenuous activity until medically cleared.",
            "Begin medication management under physician guidance if not already started.",
            "Monitor symptoms: chest pain, shortness of breath, dizziness — call emergency services if these occur.",
        ],
    }[tier]

    pdf.set_font("Helvetica", "", 10)
    for i, rec in enumerate(recommendations, 1):
        pdf.set_x(15)
        pdf.multi_cell(0, 6, f"  {i}.  {rec}")
        pdf.ln(1)

    pdf.ln(4)

    # ── FOOTER DISCLAIMER ──────────────────────────────────────────
    pdf.set_fill_color(245, 245, 248)
    pdf.rect(15, pdf.get_y(), 180, 18, "F")
    pdf.set_xy(18, pdf.get_y() + 3)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(100, 100, 100)
    pdf.multi_cell(174, 5,
        "DISCLAIMER: This report is generated by an AI model for informational purposes only. "
        "It does not constitute a medical diagnosis or replace the advice of a qualified healthcare professional. "
        "Always consult a licensed cardiologist or physician for medical decisions."
    )

    return pdf.output(dest="S").encode("latin-1")


@app.post("/predict/pdf")
def predict_pdf():
    data = request.json
    pdf_bytes = generate_pdf(data)
    return send_file(
        BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name="health-report.pdf"
    )


# ===============================
# HEALTH CHECK
# ===============================

@app.route("/")
def home():
    return jsonify({
        "status": "🩺 Healigram API running",
        "ecg_model_loaded": ecg_model is not None,
        "models": ["Random Forest", "XGBoost", "ECG CNN (ResNet18)"],
        "endpoints": {
            "POST /predict":         "Tabular + optional ECG combined prediction",
            "POST /predict-ecg":     "ECG image only prediction (NEW)",
            "POST /predict-ecg/pdf": "ECG PDF report (NEW)",
            "POST /predict/pdf":     "Tabular PDF report",
        }
    })


# ===============================
# RUN
# ===============================

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)