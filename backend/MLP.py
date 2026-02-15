# train_mlp_with_shap.py

import pandas as pd
import numpy as np
import shap
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPRegressor
from sklearn.metrics import mean_squared_error, r2_score

# ----------------------------
# Load Data
# ----------------------------
data = pd.read_csv("synthetic_medical_data.csv")

X = data[[
    "Age",
    "Sex",
    "Heart_Rate",
    "Systolic_BP",
    "Diastolic_BP",
    "Temperature"
]]

y = data["Risk"]

# ----------------------------
# Split
# ----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ----------------------------
# Scale
# ----------------------------
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# ----------------------------
# Model
# ----------------------------
mlp = MLPRegressor(
    hidden_layer_sizes=(64, 32),
    activation="relu",
    solver="adam",
    max_iter=600,
    random_state=42
)

mlp.fit(X_train_scaled, y_train)

# ----------------------------
# Evaluate
# ----------------------------
y_pred = mlp.predict(X_test_scaled)

print("MSE:", mean_squared_error(y_test, y_pred))
print("R2:", r2_score(y_test, y_pred))

# ----------------------------
# Build SHAP Explainer (ONCE)
# ----------------------------

# Small background for efficiency
background = X_train_scaled[
    np.random.choice(len(X_train_scaled), 40, replace=False)
]

explainer = shap.KernelExplainer(
    mlp.predict,
    background
)

# ----------------------------
# Save Everything
# ----------------------------
joblib.dump(mlp, "mlp_regressor.pkl")
joblib.dump(scaler, "scaler.pkl")
joblib.dump(explainer, "shap_explainer.pkl")

print("Saved: model, scaler, and SHAP explainer.")
