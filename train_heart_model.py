import pandas as pd
import numpy as np
import pickle
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

# ============ LOAD DATA ============
# Make sure cardio_train.csv is in the same directory
df = pd.read_csv("cardio_train.csv", sep=';')

# Drop ID column if present
if 'id' in df.columns:
    df = df.drop(columns=['id'])

# ============ DATA PREPROCESSING ============
# Convert age from days to years (dataset usually stores it as days)
if df['age'].mean() > 100:  # heuristic check
    df['age'] = (df['age'] / 365).round(0)

# Define target and features
target_col = 'cardio'
X = df.drop(columns=[target_col])
y = df[target_col]

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# ============ TRAIN/TEST SPLIT ============
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)

# ============ TRAIN MODEL ============
model = LogisticRegression(
    solver='liblinear',
    class_weight='balanced',
    max_iter=1000,
    random_state=42
)
model.fit(X_train, y_train)

# ============ EVALUATE ============
y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)[:, 1]

print("=== Evaluation Report ===")
print(classification_report(y_test, y_pred))
print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))
print("ROC AUC Score:", roc_auc_score(y_test, y_proba))

# ============ SAVE MODEL ============
model_data = {
    "model": model,
    "scaler": scaler,
    "features": list(X.columns)
}

with open("logistic_model.pkl", "wb") as f:
    pickle.dump(model_data, f)

print("\n✅ Model trained and saved as logistic_model.pkl")
