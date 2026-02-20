import os
from transformers import pipeline

# 1. Force transformers to look ONLY at your local cache
os.environ['TRANSFORMERS_OFFLINE'] = '1'
os.environ['HF_HUB_OFFLINE'] = '1'

print("Loading facebook/bart-large-mnli from local cache...")
try:
    # 2. Added local_files_only=True to prevent network calls
    classifier = pipeline(
        "zero-shot-classification", 
        model="facebook/bart-large-mnli",
        local_files_only=True
    )
except Exception as e:
    print(f"Error loading model: {e}")
    print("If it says 'Entry Not Found', you may need to run this once on a mobile hotspot.")

labels = [
    "routine non-urgent condition",
    "urgent medical attention needed", 
    "critical life-threatening emergency"
]


def compute_risk_score(text):
    result = classifier(text, labels)

    severity_map = {
        "routine non-urgent condition": 0.1,
        "urgent medical attention needed": 0.6,
        "critical life-threatening emergency": 0.95
    }

    risk_score = 0.0
    for label, score in zip(result["labels"], result["scores"]):
        risk_score += severity_map[label] * score

    # Return the score and the TOP label string
    return risk_score, result["labels"][0]