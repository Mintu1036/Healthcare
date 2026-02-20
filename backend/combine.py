import json
import pandas as pd
from zeroshot import compute_risk_score
from mplinf import run_mlp_inference
from explain import generate_explanation_structured


def run_combined_risk_assessment(text: str, vitals: dict):
    """
    Runs zeroshot + vitals MLP model and returns structured risk assessment.

    Args:
        text (str): Patient symptom description
        vitals (dict): Dictionary with keys:
            Age, Sex, Heart_Rate, Systolic_BP, Diastolic_BP, Temperature

    Returns:
        dict: Final structured JSON output
    """

    # ----------------------------
    # Run Models
    # ----------------------------

    zeroshot_score = compute_risk_score(text)

    vitals_df = pd.DataFrame([vitals])
    vitals_score, contributions, base_value = run_mlp_inference(vitals_df)

    final_score = 0.5 * zeroshot_score[0] + 0.5 * vitals_score

    # ----------------------------
    # Generate Structured Output
    # ----------------------------

    final_json = generate_explanation_structured(
        text,
        zeroshot_score,
        vitals_score,
        contributions,
        final_score,
        base_value,
        vitals
    )

    return final_json