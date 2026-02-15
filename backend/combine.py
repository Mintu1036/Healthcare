# combine.py

import json
import pandas as pd
from zeroshot import *
from mplinf import *
from explain import generate_explanation_structured

text = "Patient reports mild sore throat, slight nasal congestion, and occasional dry cough for the past two days. No fever or breathing difficulty."

vitals = {
    "Age": 24,
    "Sex": 0,
    "Heart_Rate": 76,
    "Systolic_BP": 112,
    "Diastolic_BP": 72,
    "Temperature": 36.9
}

# ----------------------------
# Run Models (UNCHANGED)
# ----------------------------

zeroshot_score = compute_risk_score(text)
vitals_score, contributions = run_mlp_inference(pd.DataFrame([vitals]))

final_Score = 0.5 * zeroshot_score[0] + 0.5 * vitals_score

print(zeroshot_score[1])
print("vitals Score:", vitals_score)
print("Zeroshot Score:", zeroshot_score[0])
print("Final Combined Risk Score:", final_Score)

# ----------------------------
# Generate Final Structured Output
# ----------------------------

final_json = generate_explanation_structured(
    text=text,
    zeroshot_score=zeroshot_score,
    vitals_score=vitals_score,
    contributions=contributions,
    final_score=final_Score
)

print("\nFinal Structured Output:\n")
print(json.dumps(final_json, indent=2))
