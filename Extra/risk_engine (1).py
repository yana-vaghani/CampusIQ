import json
import pandas as pd
import shap
import joblib
import sqlite3
from datetime import datetime

# -----------------------------
# 1. LOAD FILES
# -----------------------------
with open("feature_weights.json", "r") as f:
    weights = json.load(f)

model = joblib.load("model.pkl")
scaler = joblib.load("scaler.pkl")
background_data = joblib.load("background_data.pkl")

features = ["attendance", "marks", "assignment", "lms"]

# SHAP explainer (initialized once)
explainer = shap.LinearExplainer(model, background_data)

# -----------------------------
# 2. DB SETUP
# -----------------------------
def init_db():
    conn = sqlite3.connect("students.db")
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS student_risk (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        attendance REAL,
        marks REAL,
        assignment REAL,
        lms REAL,
        risk_score REAL,
        weight_score REAL,
        shap_values TEXT,
        created_at TEXT
    )
    """)

    conn.commit()
    conn.close()

# -----------------------------
# 3. NORMALIZATION
# -----------------------------
def normalize(value):
    return value / 100

# -----------------------------
# 4. WEIGHT SCORE
# -----------------------------
def calculate_weight_score(student):
    total = 0
    contributions = {}

    for f, w in weights.items():
        val = student[f]

        if f in ["attendance", "marks", "assignment"]:
            norm = 1 - normalize(val)
        else:
            norm = normalize(val)

        contrib = w * norm
        contributions[f] = round(contrib, 2)
        total += contrib

    return round(total, 2), contributions

# -----------------------------
# 5. SHAP
# -----------------------------
def shap_explanation(student):
    df = pd.DataFrame([student])
    scaled = scaler.transform(df)

    shap_values = explainer(scaled)

    shap_dict = dict(zip(features, shap_values.values[0]))
    prediction = model.predict(scaled)[0]

    return prediction, shap_dict

# -----------------------------
# 6. SAVE TO DB
# -----------------------------
def save_to_db(student, risk_score, weight_score, shap_values):
    conn = sqlite3.connect("students.db")
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO student_risk 
    (attendance, marks, assignment, lms, risk_score, weight_score, shap_values, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        student["attendance"],
        student["marks"],
        student["assignment"],
        student["lms"],
        risk_score,
        weight_score,
        json.dumps(shap_values),
        datetime.now().isoformat()
    ))

    conn.commit()
    conn.close()

# -----------------------------
# 7. MAIN PIPELINE
# -----------------------------
def run(student):

    print("\n📊 Student:", student)

    weight_score, weight_contrib = calculate_weight_score(student)
    pred, shap_contrib = shap_explanation(student)

    print("\n📈 Risk Score (Model):", round(pred, 2))
    print("📊 Weight Score:", weight_score)

    print("\n🔍 SHAP Explanation:")
    for k, v in shap_contrib.items():
        direction = "↑" if v > 0 else "↓"
        print(f"{k}: {direction} {round(v,2)}")

    save_to_db(student, pred, weight_score, shap_contrib)

    print("\n✅ Saved to database!")

# -----------------------------
# 8. TEST
# -----------------------------
if __name__ == "__main__":

    init_db()

    student = {
        "attendance": 60,
        "marks": 55,
        "assignment": 70,
        "lms": 40
    }

    run(student)