import sqlite3
import json

def get_latest():
    conn = sqlite3.connect("students.db")
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM student_risk ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()

    return {
        "attendance": row[1],
        "marks": row[2],
        "assignment": row[3],
        "lms": row[4],
        "risk_score": row[5],
        "weight_score": row[6],
        "shap": json.loads(row[7])
    }

def generate_prompt(data):
    return f"""
Student Risk Report

Risk Score: {round(data['risk_score'],2)}

Feature Impact:
{data['shap']}

Student Data:
Attendance: {data['attendance']}
Marks: {data['marks']}
Assignment: {data['assignment']}
LMS: {data['lms']}

Explain why this student is at risk and suggest improvements.
"""

if __name__ == "__main__":
    data = get_latest()
    prompt = generate_prompt(data)

    print("\n🧠 SEND THIS TO LLM:\n")
    print(prompt)