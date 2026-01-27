import os
import pandas as pd
import numpy as np
import joblib
import shap


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

# Remove impossible BP rows
df = df[df["ap_hi"] >= df["ap_lo"]]

# Clip extreme BP values
df["ap_hi"] = df["ap_hi"].clip(90, 200)
df["ap_lo"] = df["ap_lo"].clip(60, 120)

# Remove unrealistic height / weight
df = df[(df["height"] >= 120) & (df["height"] <= 220)]
df = df[(df["weight"] >= 30) & (df["weight"] <= 200)]

print("After medical cleaning:", df.shape)

# ===============================
# 3. Feature Engineering
# ===============================

# Convert age from days → years
df["age"] = df["age"] / 365.25

# BMI
df["bmi"] = df["weight"] / ((df["height"] / 100) ** 2)

# Pulse pressure
df["pulse_pressure"] = df["ap_hi"] - df["ap_lo"]

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
# 6. Imputation (Safety)
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
    n_jobs=-1
)

print("Training Random Forest...")
rf.fit(X_train_imp, y_train)

print("Training XGBoost...")
xgb.fit(X_train_imp, y_train)


# ===============================
# 8.1 SHAP Explainer (Random Forest)
# ===============================

print("Initializing SHAP explainer for Random Forest...")

# Use a small background sample for speed & stability
background = shap.sample(X_train_imp, 200, random_state=42)

rf_explainer = shap.TreeExplainer(
    rf,
    data=background,
    feature_perturbation="interventional"
)

print("SHAP explainer ready.")




# ===============================
# 9. Probability Calibration
# ===============================
from sklearn.calibration import CalibratedClassifierCV

xgb_cal = CalibratedClassifierCV(
    xgb,
    method="isotonic",
    cv=3
)
xgb_cal.fit(X_train_imp, y_train)

# ===============================
# 10. Evaluation
# ===============================
from sklearn.metrics import roc_auc_score, accuracy_score

rf_probs = rf.predict_proba(X_test_imp)[:, 1]
xgb_probs = xgb_cal.predict_proba(X_test_imp)[:, 1]

ensemble_probs = 0.4 * rf_probs + 0.6 * xgb_probs
ensemble_preds = (ensemble_probs >= 0.45).astype(int)

ensemble_auc = roc_auc_score(y_test, ensemble_probs)
ensemble_acc = accuracy_score(y_test, ensemble_preds)

print("\n🔥 FINAL ENSEMBLE PERFORMANCE")
print(f"Accuracy : {ensemble_acc:.4f}")
print(f"ROC-AUC  : {ensemble_auc:.4f}")

# ===============================
# SHAP Global Summary Plot
# ===============================

import matplotlib.pyplot as plt

# Compute SHAP values on test set
shap_values = rf_explainer.shap_values(X_test_imp)

# Summary plot for class 1 (heart disease)
shap.summary_plot(
    shap_values[1],
    X_test_imp,
    feature_names=FEATURE_COLUMNS,
    show=False
)

plt.tight_layout()
plt.savefig(os.path.join(BASE_DIR, "shap_summary_rf.png"), dpi=300)
plt.close()

print("📊 SHAP summary plot saved.")


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
    "threshold": 0.45,
    "shap": {
        "explainer_type": "tree",
        "model": "random_forest"
    },
    "metrics": {
        "accuracy": ensemble_acc,
        "roc_auc": ensemble_auc
    }
}, MODEL_PATH)

print("\n✅ Model saved at:", MODEL_PATH)
