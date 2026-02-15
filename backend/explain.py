# explain.py
# pip install groq python-dotenv pandas

import os
import json
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from groq import Groq

# --------------------------------------------------
# Setup
# --------------------------------------------------

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# --------------------------------------------------
# Load Departments CSV
# --------------------------------------------------

departments_df = pd.read_csv("departments_rows.csv")
departments_df["name_lower"] = departments_df["name"].str.lower().str.strip()

department_list = departments_df["name"].tolist()

def get_department_id(name):
    match = departments_df[
        departments_df["name_lower"] == name.lower().strip()
    ]
    if not match.empty:
        return match.iloc[0]["department_id"]
    return None

# --------------------------------------------------
# Main Function
# --------------------------------------------------

def generate_explanation_structured(
    text,
    zeroshot_score,
    vitals_score,
    contributions,
    final_score,
    base_value,
    input_values  # <-- pass original vitals dict here
):

    # --------------------------------------------------
    # Risk score (keep your logic)
    # --------------------------------------------------

    risk_score_int = int(np.clip(final_score * 100, 0, 100))

    # --------------------------------------------------
    # Build SHAP structured dict for waterfall
    # --------------------------------------------------

    base_value = float(base_value)
    prediction = float(final_score)

    # Build feature list
    features = [
        {
            "name": key,
            "value": float(input_values[key]),
            "contribution": float(value)
        }
        for key, value in contributions.items()
    ]

    # Sort by absolute importance
    features_sorted = sorted(
        features,
        key=lambda x: abs(x["contribution"]),
        reverse=True
    )

    # Precompute waterfall steps
    steps = []
    current = base_value

    steps.append({
        "label": "Base Value",
        "start": 0,
        "end": base_value
    })

    for f in features_sorted:
        start = current
        end = current + f["contribution"]

        steps.append({
            "label": f["name"],
            "start": start,
            "end": end
        })

        current = end

    steps.append({
        "label": "Final Prediction",
        "start": 0,
        "end": prediction
    })

    # Optional integrity check
    if abs(current - prediction) > 1e-3:
        print("⚠️ Warning: SHAP sum mismatch")

    # --------------------------------------------------
    # 1️⃣ EXPLANATION PROMPT
    # --------------------------------------------------

    explanation_system_prompt = """
You are a medical explainability assistant.

Explain ONLY the highest predicted severity category.
Use simple, clinically sound reasoning.
Base explanation strictly on:
- patient symptoms
- zeroshot severity label
- vitals score
- SHAP feature contributions

Do NOT invent new data.
Keep explanation under 120 words.
Return ONLY plain text explanation.
"""

    explanation_user_prompt = f"""
Patient Text:
{text}

Highest Zeroshot Label:
{zeroshot_score[1]}

Zeroshot Score:
{zeroshot_score[0]}

Vitals Score:
{vitals_score}

SHAP Contributions:
{json.dumps(contributions, indent=2)}

Final Combined Risk Score:
{risk_score_int}
"""

    explanation_response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": explanation_system_prompt},
            {"role": "user", "content": explanation_user_prompt}
        ],
        temperature=0.3
    )

    explanation_text = explanation_response.choices[0].message.content.strip()

    # --------------------------------------------------
    # 2️⃣ Department Selection
    # --------------------------------------------------

    department_system_prompt = f"""
You are a medical triage router.

Based on the patient's condition,
choose EXACTLY ONE department from this list:

{department_list}

Return ONLY the department name.
Do NOT explain.
Do NOT add extra text.
"""

    department_user_prompt = f"""
Patient Text:
{text}

Highest Zeroshot Label:
{zeroshot_score[1]}

Final Risk Score:
{risk_score_int}
"""

    department_response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": department_system_prompt},
            {"role": "user", "content": department_user_prompt}
        ],
        temperature=0
    )

    department_name = department_response.choices[0].message.content.strip()
    department_name = department_name.replace("\n", "").strip()

    department_id = get_department_id(department_name)

    if department_id is None:
        raise ValueError(
            f"Invalid department returned by LLM: '{department_name}'"
        )

    # --------------------------------------------------
    # Final JSON
    # --------------------------------------------------

    return {
        "risk_score": risk_score_int,
        "shap": {
            "base_value": base_value,
            "prediction": prediction,
            "features": features_sorted,
            "steps": steps
        },
        "explainability": explanation_text,
        "recommended_department": department_id
    }
