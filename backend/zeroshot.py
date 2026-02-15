from transformers import pipeline

print("Loading facebook/bart-large-mnli...")
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

labels = [
    "routine non-urgent condition",
    "urgent medical attention needed", 
    "critical life-threatening emergency"
]

# test_cases = [
#     # Test 1: Clear Low Severity 
#     # (Checking if it realizes "asthma" is safe when paired with "refill" and "stable")
#     "Patient needs a refill on their asthma inhaler. No current shortness of breath or wheezing. Vitals stable.",
    
#     # Test 2: Clear High Severity 
#     # (Checking if it catches classic red-flag emergency phrasing)
#     "72yo male presents with sudden onset of worst headache of his life, accompanied by neck stiffness and vomiting. BP 190/110.",
    
#     # Test 3: The "Hard Negative" Low/Medium 
#     # (Checking if it blindly triggers on "chest pain", or if it understands the context of a workout)
#     "22yo female reporting sharp chest pain, but notes it only hurts when she presses on her ribs after a heavy bench press workout yesterday.",
    
#     # Test 4: Clear Medium Severity 
#     # (Checking if it understands that bleeding needs attention, but isn't immediately lethal if controlled)
#     "45yo male with a deep 3-inch laceration on his forearm from a kitchen knife. Bleeding is controlled with pressure, but needs stitches. Normal vitals.",
    
#     # Test 5: The Subtle High Severity 
#     # (Checking if it recognizes atypical heart attack symptoms: sweating, paleness, and diabetic history)
#     "60yo diabetic patient complaining of vague shoulder ache and profound sweating (diaphoresis) that woke him from sleep. Looks pale."
# ]


def compute_risk_score(text):
    for i in text:
        result = classifier(text, labels)

        # Severity mapping
        severity_map = {
            "routine non-urgent condition": 0.1,
            "urgent medical attention needed": 0.6,
            "critical life-threatening emergency": 0.95
        }

        # Weighted risk score
        risk_score = 0.0
        for label, score in zip(result["labels"], result["scores"]):
            risk_score += severity_map[label] * score

        return risk_score, result
