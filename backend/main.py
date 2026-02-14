import os
import random
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client
import pdfplumber
from io import BytesIO



# 🔹 Load .env
load_dotenv()




SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)



app = FastAPI(title="Medical Voice + Triage Backend")

# 🔹 CORS (allow Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔒 change to frontend URL in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔹 ENV VARIABLES
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
SARVAM_URL = "https://api.sarvam.ai/speech-to-text-translate"

# 🔹 Departments for dummy triage
DEPARTMENT_IDS = [
    "703be28b-bc99-49e4-af4b-0cdd3d68edfc",  # Emergency
    "e818f375-3596-4f14-87b1-aba37b7c18cc",  # Cardiology
    "6a37f08c-41ab-4204-b745-dfce7e42c106",  # Neurology
    "bfabb37c-fe0a-4329-a685-13ad4d5c1096",  # Pulmonology
    "ab1d50e0-5262-4689-919b-b7aa13343a50"   # General Medicine
]

# ==============================
# 🎤 Speech → Symptoms (Sarvam)
# ==============================
@app.post("/process-symptoms")
async def process_symptoms(
    file: UploadFile = File(...),
    model: str = Form("saaras:v2.5")
):
    if not SARVAM_API_KEY:
        raise HTTPException(status_code=500, detail="Sarvam API Key not configured")

    try:
        audio_content = await file.read()

        files = {
            "file": (file.filename, audio_content, file.content_type)
        }

        data = {
            "model": model
        }

        headers = {
            "api-subscription-key": SARVAM_API_KEY
        }

        response = requests.post(
            SARVAM_URL,
            headers=headers,
            data=data,
            files=files,
            timeout=30
        )

        response.raise_for_status()
        sarvam_data = response.json()

        return {
            "success": True,
            "transcript": sarvam_data.get("transcript"),
            "symptoms": sarvam_data.get("translated_text")
        }

    except requests.exceptions.RequestException as e:
        print(f"Sarvam error: {e}")
        raise HTTPException(status_code=502, detail="Error communicating with Sarvam AI")

    except Exception as e:
        print(f"Server error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==============================
# 🧠 TRIAGE INPUT MODEL
# ==============================
class TriageInput(BaseModel):
    symptoms: list[str] | None = None
    heart_rate: int | None = None
    systolic_bp: int | None = None
    diastolic_bp: int | None = None
    temperature: float | None = None


# ==============================
# 🏥 DUMMY TRIAGE AI
# ==============================
@app.post("/triage")
def triage(data: TriageInput):
    try:
        risk_score = 20

        # 🔹 semi-realistic dummy logic
        if data.heart_rate and data.heart_rate > 110:
            risk_score += 25

        if data.temperature and data.temperature > 38:
            risk_score += 20

        if data.systolic_bp and data.systolic_bp > 160:
            risk_score += 20

        if data.symptoms:
            symptoms_lower = [s.lower() for s in data.symptoms]

            if "chest pain" in symptoms_lower:
                risk_score += 30

            if "breathlessness" in symptoms_lower:
                risk_score += 25

            if "dizziness" in symptoms_lower:
                risk_score += 10

        risk_score = min(risk_score, 100)

        department_id = random.choice(DEPARTMENT_IDS)

        explanation = "Risk estimated from symptoms and available vitals."

        return {
            "risk_score": risk_score,
            "department_id": department_id,
            "explanation": explanation
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




class EHRInput(BaseModel):
    fileUrl: str
    patientId: str


@app.post("/extract-ehr")
def extract_ehr(data: EHRInput):
    try:
        # 1️⃣ Download PDF
        response = requests.get(data.fileUrl)
        response.raise_for_status()

        # 2️⃣ Extract text
        extracted_text = ""
        with pdfplumber.open(BytesIO(response.content)) as pdf:
            for page in pdf.pages:
                extracted_text += page.extract_text() or ""

        # limit size (important)
        extracted_text = extracted_text[:20000]

        # 3️⃣ Update Supabase
        supabase.table("patients") \
            .update({"ehr_data": extracted_text}) \
            .eq("patient_id", data.patientId) \
            .execute()

        return {"success": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# ==============================
# 🚀 RUN SERVER
# ==============================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
