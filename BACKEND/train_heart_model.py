import os
import pandas as pd
import numpy as np
import joblib

# ===============================
# 1. Load Dataset
# ===============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "cardio_train.csv")

df = pd.read_csv(CSV_PATH, sep=";")
df.drop(columns=["id"], inplace=True)

print("Original shape:", df.shape)

# ===============================
# 2. Medical Data Cleaning
# ===============================
df = df[df["ap_hi"] >= df["ap_lo"]]

df["ap_hi"] = df["ap_hi"].clip(90, 200)
df["ap_lo"] = df["ap_lo"].clip(60, 120)

df = df[(df["height"] >= 120) & (df["height"] <= 220)]
df = df[(df["weight"] >= 30) & (df["weight"] <= 200)]

print("After medical cleaning:", df.shape)

# ===============================
# 3. Feature Engineering
# ===============================

# Age (years)
df["age"] = df["age"] / 365.25

# Age groups
df["age_group"] = pd.cut(
    df["age"],
    bins=[0, 40, 50, 60, 70, 120],
    labels=["<40", "40-50", "50-60", "60-70", "70+"]
)
df = pd.get_dummies(df, columns=["age_group"], drop_first=True)

# BMI
df["bmi"] = df["weight"] / ((df["height"] / 100) ** 2)

# BMI categories
df["bmi_category"] = pd.cut(
    df["bmi"],
    bins=[0, 18.5, 25, 30, 100],
    labels=["underweight", "normal", "overweight", "obese"]
)
df = pd.get_dummies(df, columns=["bmi_category"], drop_first=True)

# Pulse pressure
df["pulse_pressure"] = df["ap_hi"] - df["ap_lo"]

# Hypertension staging
df["hypertension_stage"] = 0
df.loc[(df["ap_hi"] >= 140) | (df["ap_lo"] >= 90), "hypertension_stage"] = 1
df.loc[(df["ap_hi"] >= 160) | (df["ap_lo"] >= 100), "hypertension_stage"] = 2

# Interaction features
df["age_bmi_interaction"] = df["age"] * df["bmi"]
df["bp_pulse_interaction"] = df["pulse_pressure"] * df["ap_hi"]

# ===============================
# 4. Target & Features
# ===============================
TARGET_COL = "cardio"

X = df.drop(columns=[TARGET_COL])
y = df[TARGET_COL]

FEATURE_COLUMNS = X.columns.tolist()

# ===============================
# 5. Train-Test Split
# ===============================
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# ===============================
# 6. Imputation
# ===============================
from sklearn.impute import SimpleImputer

imputer = SimpleImputer(strategy="median")
X_train_imp = imputer.fit_transform(X_train)
X_test_imp = imputer.transform(X_test)

# ===============================
# 7. Handle Class Imbalance
# ===============================
neg, pos = np.bincount(y_train)
scale_pos_weight = neg / pos

print("Scale_pos_weight:", scale_pos_weight)

# ===============================
# 8. Models
# ===============================
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier

rf = RandomForestClassifier(
    n_estimators=300,
    max_depth=12,
    min_samples_leaf=10,
    random_state=42,
    n_jobs=-1,
    class_weight="balanced"
)

xgb = XGBClassifier(
    n_estimators=600,
    max_depth=8,
    learning_rate=0.03,
    subsample=0.85,
    colsample_bytree=0.85,
    scale_pos_weight=scale_pos_weight,
    eval_metric="auc",
    random_state=42,
    n_jobs=-1,
    verbosity=0
)

print("Training Random Forest...")
rf.fit(X_train_imp, y_train)

print("Training XGBoost...")
xgb.fit(X_train_imp, y_train)

# ===============================
# 9. Calibration
# ===============================
from sklearn.calibration import CalibratedClassifierCV

xgb_cal = CalibratedClassifierCV(
    xgb,
    method="isotonic",
    cv=3
)
xgb_cal.fit(X_train_imp, y_train)

# ===============================
# 10. Evaluation (CONSISTENT THRESHOLD)
# ===============================
from sklearn.metrics import roc_auc_score, accuracy_score

rf_probs = rf.predict_proba(X_test_imp)[:, 1]
xgb_probs = xgb_cal.predict_proba(X_test_imp)[:, 1]

THRESHOLD = 0.30

ensemble_probs = 0.4 * rf_probs + 0.6 * xgb_probs
ensemble_preds = (ensemble_probs >= THRESHOLD).astype(int)

ensemble_auc = roc_auc_score(y_test, ensemble_probs)
ensemble_acc = accuracy_score(y_test, ensemble_preds)

print("\n🔥 FINAL ENSEMBLE PERFORMANCE")
print(f"Accuracy : {ensemble_acc:.4f}")
print(f"ROC-AUC  : {ensemble_auc:.4f}")

# ===============================
# 11. Save Model
# ===============================
MODEL_PATH = os.path.join(BASE_DIR, "heart_disease_ensemble_pro.pkl")

joblib.dump({
    "models": {
        "random_forest": rf,
        "xgb_calibrated": xgb_cal
    },
    "imputer": imputer,
    "features": FEATURE_COLUMNS,
    "threshold": THRESHOLD,
    "explainability": {
        "method": "SHAP",
        "model": "random_forest"
    },
    "metrics": {
        "accuracy": ensemble_acc,
        "roc_auc": ensemble_auc
    }
}, MODEL_PATH)

print("\n✅ Model saved at:", MODEL_PATH)
