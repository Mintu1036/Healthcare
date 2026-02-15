# inference_with_shap.py

import joblib
import shap
import pandas as pd
import matplotlib.pyplot as plt

# ----------------------------
# Load Model + Scaler + Explainer
# ----------------------------
mlp = joblib.load("mlp_regressor.pkl")
scaler = joblib.load("scaler.pkl")
explainer = joblib.load("shap_explainer.pkl")

# ----------------------------
# Inference Function
# ----------------------------
def run_mlp_inference(sample_df, visualize=True):

    # Scale
    sample_scaled = scaler.transform(sample_df)

    # Predict
    prediction = mlp.predict(sample_scaled)[0]

    # Efficient SHAP (limit sampling)
    shap_values = explainer.shap_values(sample_scaled, nsamples=60)

    contributions = dict(
        zip(sample_df.columns, shap_values[0])
    )

    # print("\nPredicted Risk:", round(prediction, 4))
    # print("\nFeature Contributions (sorted):")

    for k, v in sorted(contributions.items(),
                       key=lambda x: abs(x[1]),
                       reverse=True):
        print(f"{k}: {v:.4f}")

    # ----------------------------
    # Optional Visualization
    # ----------------------------
    if visualize:
        explanation = shap.Explanation(
            values=shap_values[0],
            base_values=explainer.expected_value,
            data=sample_df.iloc[0].values,
            feature_names=sample_df.columns
        )

        shap.plots.waterfall(explanation)
        plt.show()

    return prediction, contributions


# ----------------------------
# Example Usage
# ----------------------------
# sample = pd.DataFrame([{
#     "Age": 70,
#     "Sex": 1,
#     "Heart_Rate": 110,
#     "Systolic_BP": 170,
#     "Diastolic_BP": 95,
#     "Temperature": 38.2
# }])

# run_mlp_inference(sample)
