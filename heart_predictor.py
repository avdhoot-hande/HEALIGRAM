import pickle
import numpy as np
import pandas as pd

# ============ LOAD MODEL ============
with open("logistic_model.pkl", "rb") as f:
    model_data = pickle.load(f)

model = model_data["model"]
scaler = model_data["scaler"]
feature_names = model_data["features"]

# Debug: print feature names loaded from model
print("[DEBUG] Model expects features:", feature_names)

# ============ USER INPUT ============
print("Enter patient details to predict heart disease:\n")


user_data = {}
user_data["age_years"] = float(input("Age (in years): "))
user_data["gender"] = int(input("Gender (1 = Male, 2 = Female): "))
user_data["height"] = float(input("Height (in cm): "))
user_data["weight"] = float(input("Weight (in kg): "))
user_data["ap_hi"] = int(input("Systolic blood pressure (ap_hi): "))
user_data["ap_lo"] = int(input("Diastolic blood pressure (ap_lo): "))
user_data["cholesterol"] = int(input("Cholesterol level (1 = Normal, 2 = Above Normal, 3 = Well Above Normal): "))
user_data["gluc"] = int(input("Glucose level (1 = Normal, 2 = Above Normal, 3 = Well Above Normal): "))
user_data["smoke"] = int(input("Smoke (0 = No, 1 = Yes): "))
user_data["alco"] = int(input("Alcohol intake (0 = No, 1 = Yes): "))
user_data["active"] = int(input("Physical activity (0 = No, 1 = Yes): "))

if set(feature_names) != set(user_data.keys()):
    mapped_data = {}
    for fname in feature_names:
        if fname in user_data:
            mapped_data[fname] = user_data[fname]
        else:
            match = next((k for k in user_data if k.replace('_', '').lower() == fname.replace('_', '').lower()), None)
            if match:
                mapped_data[fname] = user_data[match]
            else:
                raise KeyError(f"Input missing required feature: {fname}. Please check your input and model feature names.")
    input_df = pd.DataFrame([mapped_data])[feature_names]
else:
    input_df = pd.DataFrame([user_data])[feature_names]

scaled_input = scaler.transform(input_df)

prediction = model.predict(scaled_input)[0]
prob = model.predict_proba(scaled_input)[0][1]

print("\n--- Result ---")
if prediction == 1:
    print("⚠️  Heart Disease Detected")
else:
    print("✅  No Heart Disease Detected")

print(f"Prediction confidence: {prob*100:.2f}%\n")
