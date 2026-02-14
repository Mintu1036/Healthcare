'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/* ---------------- Sarvam STT ---------------- */
const SarvamSTT = ({ onTranslated }: { onTranslated: (text: string) => void }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedLang, setSelectedLang] = useState('unknown')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const API_KEY = process.env.NEXT_PUBLIC_SARVAM_API_KEY

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await sendToSarvam(audioBlob)
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch {
      alert('Microphone access denied.')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  const sendToSarvam = async (blob: Blob) => {
    if (!API_KEY) return alert('Sarvam API key missing')
    setLoading(true)

    const formData = new FormData()
    formData.append('file', blob, 'audio.wav')
    formData.append('model', 'saaras:v2.5')

    if (selectedLang !== 'unknown') {
      formData.append('language_code', selectedLang)
    }

    try {
      const res = await fetch('https://api.sarvam.ai/speech-to-text-translate', {
        method: 'POST',
        headers: { 'api-subscription-key': API_KEY },
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        onTranslated(data.translated_text || data.transcript || '')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <select
        value={selectedLang}
        onChange={(e) => setSelectedLang(e.target.value)}
        className="text-sm border rounded p-1"
      >
        <option value="unknown">Auto Detect</option>
        <option value="hi-IN">Hindi</option>
        <option value="ta-IN">Tamil</option>
        <option value="te-IN">Telugu</option>
        <option value="bn-IN">Bengali</option>
      </select>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-4 py-2 rounded-full text-white font-bold ${
          isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-600'
        }`}
      >
        {loading ? 'Processing...' : isRecording ? 'Stop & Translate' : '🎤 Start Speaking'}
      </button>
    </div>
  )
}

/* ---------------- MAIN PAGE ---------------- */
export default function PatientDashboard() {
  const supabase = createClient()

  const [reportUrl, setReportUrl] = useState<string | null>(null)
  const [patientId, setPatientId] = useState<string | null>(null)
  const [filePath, setFilePath] = useState<string | null>(null)
  const [ehrText, setEhrText] = useState<string>('')

  const [uploading, setUploading] = useState(false)

  const [symptoms, setSymptoms] = useState('')
  const [heartRate, setHeartRate] = useState('')
  const [systolicBP, setSystolicBP] = useState('')
  const [diastolicBP, setDiastolicBP] = useState('')
  const [temperature, setTemperature] = useState('')

  const [triageLoading, setTriageLoading] = useState(false)
  const [triageResult, setTriageResult] = useState<any>(null)

  /* ---------------- LOAD PATIENT ---------------- */
  useEffect(() => {
    const loadPatient = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_user_id', user.id)
        .single()

      const { data: patient } = await supabase
        .from('patients')
        .select('patient_id, ehr_report_url, ehr_data')
        .eq('user_id', profile?.user_id)
        .single()

      if (patient) {
        setPatientId(patient.patient_id)
        setReportUrl(patient.ehr_report_url)
        setEhrText(patient.ehr_data || '')

        if (patient.ehr_report_url) {
          const path = patient.ehr_report_url.split('/emrehr/')[1]
          setFilePath(path)
        }
      }
    }

    loadPatient()
  }, [])

  /* ---------------- EHR UPLOAD ---------------- */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !patientId) return

    const file = e.target.files[0]
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      alert('Only PDF/JPG/PNG allowed')
      return
    }

    setUploading(true)

    const newFilePath = `ehr/${patientId}-${Date.now()}-${file.name}`

    if (filePath) await supabase.storage.from('emrehr').remove([filePath])

    const { error: uploadError } = await supabase.storage.from('emrehr').upload(newFilePath, file)
    if (uploadError) {
      alert(uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('emrehr').getPublicUrl(newFilePath)
    const publicUrl = data.publicUrl

    await supabase.from('patients').update({ ehr_report_url: publicUrl }).eq('patient_id', patientId)

    setReportUrl(publicUrl)
    setFilePath(newFilePath)

    // 🔹 call FastAPI to extract text
    await fetch('http://localhost:8000/extract-ehr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileUrl: publicUrl, patientId })
    })

    setUploading(false)
  }

  /* ---------------- DELETE EHR ---------------- */
  const handleDelete = async () => {
    if (!filePath || !patientId) return

    setUploading(true)

    await supabase.storage.from('emrehr').remove([filePath])

    await supabase
      .from('patients')
      .update({ ehr_report_url: null, ehr_data: null })
      .eq('patient_id', patientId)

    setReportUrl(null)
    setFilePath(null)
    setEhrText('')
    setUploading(false)
  }

  /* ---------------- TRIAGE SUBMIT ---------------- */
  const handleTriageSubmit = async () => {
    if (!patientId) return
    setTriageLoading(true)

    try {
      console.log("pre_existing_conditions : ",ehrText ? ehrText.substring(0, 1000) : null)
      console.log("symptoms : ",symptoms)
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          symptoms: symptoms,
          heart_rate: heartRate ? Number(heartRate) : null,
          systolic_bp: systolicBP ? Number(systolicBP) : null,
          diastolic_bp: diastolicBP ? Number(diastolicBP) : null,
          temperature: temperature ? Number(temperature) : null,
          pre_existing_conditions: ehrText ? ehrText?.substring(0, 1000) : null // send first 1000 chars of EHR text
        })
      })

      const data = await res.json()
      setTriageResult(data)
    } catch (err) {
      console.error("error in triage submission:", err)
    } finally {
      setTriageLoading(false)
    }
  }

  const riskColor =
    triageResult?.risk_score >= 75
      ? 'text-red-600'
      : triageResult?.risk_score >= 40
      ? 'text-yellow-600'
      : 'text-green-600'

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Patient Dashboard</h1>

      {/* ---------------- EHR ---------------- */}
      <div>
        {reportUrl ? (
          <div className="border rounded-xl p-4 bg-white shadow-sm">
            <div className="flex justify-between items-center">
              <span>📄 EHR Report</span>
              <a href={reportUrl} target="_blank" className="text-blue-600 underline">
                View
              </a>
            </div>

            <div className="flex gap-2 mt-3">
              <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer">
                Replace
                <input type="file" className="hidden" onChange={handleUpload} />
              </label>

              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            </div>

            {uploading && <p className="text-sm mt-2">Processing...</p>}
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-xl p-4">
            <input type="file" onChange={handleUpload} />
          </div>
        )}
      </div>

      {/* ---------------- TRIAGE FORM ---------------- */}
      <div className="border rounded-xl p-6 bg-white shadow-sm">
        <h2 className="text-xl font-bold mb-4">AI Triage Assessment</h2>

        <textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          className="w-full border rounded-lg p-3 h-28"
          placeholder="Enter symptoms..."
        />

        <div className="mt-4">
          <SarvamSTT
            onTranslated={(text) =>
              setSymptoms((prev) => (prev ? `${prev}, ${text}` : text))
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <input placeholder="Heart Rate" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} className="border p-2 rounded" />
          <input placeholder="Temp °C" value={temperature} onChange={(e) => setTemperature(e.target.value)} className="border p-2 rounded" />
          <input placeholder="Systolic BP" value={systolicBP} onChange={(e) => setSystolicBP(e.target.value)} className="border p-2 rounded" />
          <input placeholder="Diastolic BP" value={diastolicBP} onChange={(e) => setDiastolicBP(e.target.value)} className="border p-2 rounded" />
        </div>

        <button
          onClick={handleTriageSubmit}
          disabled={triageLoading}
          className="w-full mt-5 bg-black text-white py-3 rounded-lg font-bold"
        >
          {triageLoading ? 'Analyzing...' : 'Run Triage Analysis'}
        </button>

        {triageResult && (
          <div className="mt-5 p-4 border rounded-lg bg-slate-50">
            <p className={`text-lg font-bold ${riskColor}`}>
              Risk Score: {triageResult.risk_score}
            </p>
            <p className="text-sm">Department: {triageResult.department_id}</p>
            <p className="text-xs text-slate-600 mt-1">{triageResult.explanation}</p>
          </div>
        )}
      </div>
    </div>
  )
}
