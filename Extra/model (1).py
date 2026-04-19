import pandas as pd
import numpy as np
import json
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score

# -----------------------------
# 1. LOAD DATA (SAFE + MEMORY OPTIMIZED)
# -----------------------------
df = pd.read_csv(
    "TS-PS12.csv",
    engine="python",
    on_bad_lines="skip",
    dtype={
        "attendance": "float32",
        "marks": "float32",
        "assignment": "float32",
        "lms": "float32",
        "risk_score": "float32"
    }
)

df.columns = df.columns.str.lower()

# -----------------------------
# 2. FEATURES & TARGET
# -----------------------------
features = ["attendance", "marks", "assignment", "lms"]
target = "risk_score"

X = df[features]
y = df[target]

# -----------------------------
# 3. TRAIN-TEST SPLIT
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# -----------------------------
# 4. SCALE FEATURES
# -----------------------------
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# -----------------------------
# 5. TRAIN MODEL
# -----------------------------
model = LinearRegression()
model.fit(X_train_scaled, y_train)

# -----------------------------
# 6. EVALUATE
# -----------------------------
y_pred = model.predict(X_test_scaled)

print("\n📊 Model Evaluation:")
print("MAE:", round(float(mean_absolute_error(y_test, y_pred)), 2))
print("R²:", round(float(r2_score(y_test, y_pred)), 2))

# -----------------------------
# 7. SAVE MODEL FILES
# -----------------------------
joblib.dump(model, "model.pkl")
joblib.dump(scaler, "scaler.pkl")

# Save small SHAP background (important for memory)
background_sample = X_train_scaled[:100]
joblib.dump(background_sample, "background_data.pkl")

# -----------------------------
# 8. SAVE WEIGHTS JSON (FIXED)
# -----------------------------
coeffs = model.coef_
abs_coeffs = np.abs(coeffs)
weights = abs_coeffs / abs_coeffs.sum()

# ✅ FIX: convert numpy.float32 → float
weight_json = {
    features[i]: float(round(weights[i] * 100, 2))
    for i in range(len(features))
}

with open("feature_weights.json", "w") as f:
    json.dump(weight_json, f, indent=2)

print("\n✅ Model, scaler, weights saved successfully!")