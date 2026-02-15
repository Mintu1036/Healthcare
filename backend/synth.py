import numpy as np
import pandas as pd

np.random.seed(42)
N = 5000

# ----------------------------
# Helper: Piecewise severity
# ----------------------------

def scale(value, low, mid, high):
    """
    Piecewise scaling:
    value <= low → 0
    low → mid → linear to 0.6
    mid → high → linear to 1
    above high → 1
    """
    if value <= low:
        return 0
    elif value <= mid:
        return 0.6 * (value - low) / (mid - low)
    elif value <= high:
        return 0.6 + 0.4 * (value - mid) / (high - mid)
    else:
        return 1

# Vectorized version
def vscale(arr, low, mid, high):
    return np.vectorize(scale)(arr, low, mid, high)

# ----------------------------
# Generate vitals
# ----------------------------

age = np.random.randint(18, 90, N)
sex = np.random.binomial(1, 0.5, N)

heart_rate = np.clip(np.random.normal(85, 25, N), 40, 180)
sbp = np.clip(np.random.normal(130 + 0.3*age, 25, N), 70, 220)
dbp = np.clip(np.random.normal(80 + 0.2*age, 15, N), 40, 130)
temperature = np.clip(np.random.normal(37.2, 0.8, N), 34, 41)

# ----------------------------
# Severity Scores
# ----------------------------

sbp_sev = vscale(sbp, 130, 160, 190)
dbp_sev = vscale(dbp, 85, 100, 115)
hr_sev = vscale(heart_rate, 100, 120, 150)
temp_sev = vscale(temperature, 37.5, 38.5, 39.5)
age_sev = vscale(age, 60, 70, 85)

# Shock condition bonus
shock = ((sbp < 95) & (heart_rate > 110)).astype(float)

# ----------------------------
# Combine Severity (Structured)
# ----------------------------

risk = (
    0.30 * sbp_sev +
    0.15 * dbp_sev +
    0.15 * hr_sev +
    0.15 * temp_sev +
    0.10 * age_sev +
    0.10 * shock +
    0.05 * sex
)

risk = np.clip(risk, 0, 0.95)  # intentional ceiling

# ----------------------------
# Save
# ----------------------------

data = pd.DataFrame({
    "Age": age,
    "Sex": sex,
    "Heart_Rate": heart_rate,
    "Systolic_BP": sbp,
    "Diastolic_BP": dbp,
    "Temperature": temperature,
    "Risk": risk
})

data.to_csv("structured_synthetic_medical_data.csv", index=False)

print("Saved to structured_synthetic_medical_data.csv")
print("\nRisk Summary:")
print(data["Risk"].describe())
