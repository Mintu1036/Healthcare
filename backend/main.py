import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

app = FastAPI(title="Medical Voice Backend")

# 1️⃣ Configure CORS for your Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SARVAM_API_KEY = os.getenv("sk_b29s1lxh_8b6T6LW55L3LxjTOCP7U0ULY")
SARVAM_URL = "https://api.sarvam.ai/speech-to-text-translate"

@app.post("/process-symptoms")
async def process_symptoms(
    file: UploadFile = File(...),
    model: str = Form("saaras:v2.5")
):
    """
    Receives audio, sends it to Sarvam AI, and returns English symptoms.
    """
    if not SARVAM_API_KEY:
        raise HTTPException(status_code=500, detail="Sarvam API Key not configured")

    try:
        # 2️⃣ Read the uploaded file
        audio_content = await file.read()
        
        # 3️⃣ Prepare payload for Sarvam AI
        files = {
            'file': (file.filename, audio_content, file.content_type)
        }
        data = {
            'model': model
        }
        headers = {
            'api-subscription-key': SARVAM_API_KEY
        }

        # 4️⃣ Forward to Sarvam
        response = requests.post(SARVAM_URL, headers=headers, data=data, files=files)
        response.raise_for_status()
        
        sarvam_data = response.json()

        # Return both the native transcript and the English translation
        return {
            "success": True,
            "transcript": sarvam_data.get("transcript"),
            "symptoms": sarvam_data.get("translated_text")
        }

    except requests.exceptions.RequestException as e:
        print(f"Error calling Sarvam: {e}")
        raise HTTPException(status_code=502, detail="Error communicating with Sarvam AI")
    except Exception as e:
        print(f"Server Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)