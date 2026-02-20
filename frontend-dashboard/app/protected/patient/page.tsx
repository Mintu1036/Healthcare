'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mic, MicOff, FileText, Upload, Trash2, Activity, Thermometer, Heart, ChevronRight } from 'lucide-react'

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
      mediaRecorderRef.current.ondataavailable = (event) => { audioChunksRef.current.push(event.data) }
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await sendToSarvam(audioBlob)
        stream.getTracks().forEach((t) => t.stop())
      }
      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch { alert('Microphone access denied.') }
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
    if (selectedLang !== 'unknown') formData.append('language_code', selectedLang)

    try {
      const res = await fetch('https://api.sarvam.ai/speech-to-text-translate', {
        method: 'POST',
        headers: { 'api-subscription-key': API_KEY },
        body: formData,
      })
      const data = await res.json()
      if (res.ok) onTranslated(data.translated_text || data.transcript || '')
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
      {/* <select
        value={selectedLang}
        onChange={(e) => setSelectedLang(e.target.value)}
        className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100"
      >
        <option value="unknown">Auto Detect</option>
        <option value="hi-IN">Hindi</option>
        <option value="ta-IN">Tamil</option>
        <option value="te-IN">Telugu</option>
        <option value="bn-IN">Bengali</option>
      </select> */}

      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm ${
          isRecording 
          ? 'bg-red-500 text-white animate-pulse shadow-red-100' 
          : 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-50'
        }`}
      >
        {loading ? (
          <span className="animate-spin">🌀</span>
        ) : isRecording ? (
          <><MicOff size={16} /> Stop Recording</>
        ) : (
          <><Mic  size={16} /> Speak Symptoms <span className='text-xs text-slate-500'>(Multilingual)</span></>
        )}
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

  useEffect(() => {
    const loadPatient = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('users').select('user_id').eq('auth_user_id', user.id).single()
      const { data: patient } = await supabase.from('patients').select('patient_id, ehr_report_url, ehr_data').eq('user_id', profile?.user_id).single()
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !patientId) return
    const file = e.target.files[0]
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      alert('Only PDF/JPG/PNG allowed'); return
    }
    setUploading(true)
    const newFilePath = `ehr/${patientId}-${Date.now()}-${file.name}`
    if (filePath) await supabase.storage.from('emrehr').remove([filePath])
    const { error: uploadError } = await supabase.storage.from('emrehr').upload(newFilePath, file)
    if (uploadError) { alert(uploadError.message); setUploading(false); return }
    const { data } = supabase.storage.from('emrehr').getPublicUrl(newFilePath)
    const publicUrl = data.publicUrl
    await supabase.from('patients').update({ ehr_report_url: publicUrl }).eq('patient_id', patientId)
    setReportUrl(publicUrl); setFilePath(newFilePath)
    await fetch('http://localhost:8000/extract-ehr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileUrl: publicUrl, patientId })
    })
    setUploading(false)
  }

  const handleDelete = async () => {
    if (!filePath || !patientId) return
    setUploading(true)
    await supabase.storage.from('emrehr').remove([filePath])
    await supabase.from('patients').update({ ehr_report_url: null, ehr_data: null }).eq('patient_id', patientId)
    setReportUrl(null); setFilePath(null); setEhrText(''); setUploading(false)
  }

  const handleTriageSubmit = async () => {
    if (!patientId) return
    setTriageLoading(true)
    try {
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
          pre_existing_conditions: ehrText ? ehrText?.substring(0, 1000) : null
        })
      })
      const data = await res.json()
      setTriageResult(data)
    } catch (err) { console.error(err) } finally { setTriageLoading(false) }
  }

  const riskColor =
    triageResult?.risk_score >= 75 ? 'text-red-600 bg-red-50 border-red-100'
    : triageResult?.risk_score >= 40 ? 'text-amber-600 bg-amber-50 border-amber-100'
    : 'text-emerald-600 bg-emerald-50 border-emerald-100'

  const inputClasses = "w-full border border-slate-200 bg-white rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all";

  return (
    <div className="min-h-screen bg-[#fcfdfe] p-6 md:p-12 transition-all">
      <div className="max-w-3xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Patient <span className="text-blue-600">Dashboard</span></h1>
          <p className="text-slate-500 font-medium">Update your vitals and submit you application.</p>
        </header>

        {/* ---------------- EHR SECTION ---------------- */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 ml-1">Medical Records</h2>
          {reportUrl ? (
            <div className="group relative border border-slate-100 bg-white rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><FileText size={24} /></div>
                  <div>
                    <h3 className="font-bold text-slate-800">EHR Report Active</h3>
                    <p className="text-xs text-slate-400">All you data is comptelely secure</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={reportUrl} target="_blank" className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><ChevronRight size={20} /></a>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <label className="flex-1 flex items-center justify-center gap-2 bg-slate-50 text-slate-600 text-xs font-bold px-4 py-3 rounded-xl cursor-pointer hover:bg-slate-100 transition-all">
                  <Upload size={14} /> Replace Record
                  <input type="file" className="hidden" onChange={handleUpload} />
                </label>
                <button onClick={handleDelete} className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
              {uploading && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-[24px] flex items-center justify-center font-bold text-blue-600 text-sm animate-pulse">Syncing Data...</div>}
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 rounded-[24px] p-10 bg-white hover:border-blue-300 hover:bg-blue-50/30 transition-all group">
              <label className="flex flex-col items-center gap-3 cursor-pointer">
                <div className="p-4 bg-slate-50 text-slate-400 rounded-full group-hover:text-blue-500 transition-colors"><Upload size={24} /></div>
                <span className="text-sm font-bold text-slate-500">Upload EHR or Medical Reports</span>
                <span className="text-xs text-slate-400">PDF, JPG, or PNG (Max 5MB)</span>
                <input type="file" className="hidden" onChange={handleUpload} />
              </label>
            </div>
          )}
        </section>

        {/* ---------------- TRIAGE FORM ---------------- */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 ml-1">Symptom Assessment</h2>
          <div className="border border-slate-100 bg-white rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)] space-y-6">
            
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Current Symptoms</label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className={`${inputClasses} h-32 resize-none`}
                placeholder="Describe how you are feeling in detail..."
              />
              <SarvamSTT onTranslated={(text) => setSymptoms((prev) => (prev ? `${prev}, ${text}` : text))} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase ml-1"><Heart size={10}/> Heart Rate</span>
                <input placeholder="bpm" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} className={inputClasses} />
              </div>
              <div className="space-y-1">
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase ml-1"><Thermometer size={10}/> Temp</span>
                <input placeholder="°C" value={temperature} onChange={(e) => setTemperature(e.target.value)} className={inputClasses} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase ml-1 block">Systolic BP</span>
                <input placeholder="mmHg" value={systolicBP} onChange={(e) => setSystolicBP(e.target.value)} className={inputClasses} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase ml-1 block">Diastolic BP</span>
                <input placeholder="mmHg" value={diastolicBP} onChange={(e) => setDiastolicBP(e.target.value)} className={inputClasses} />
              </div>
            </div>

            <button
              onClick={handleTriageSubmit}
              disabled={triageLoading}
              className="group w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {triageLoading ? (
                <span className="flex items-center gap-2">
                  <Activity className="animate-spin" size={18} /> Processing Analysis...
                </span>
              ) : (
                <>Submit <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>

            {/* RESULTS VIEW */}
            {triageResult && (
              <div className={`mt-8 p-6 border rounded-2xl transition-all animate-in zoom-in-95 duration-300 ${riskColor}`}>

                  <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Thank You! We will allot you with a Physician as aoon as possible!</span>

                </div>
  

            )}
          </div>
        </section>
      </div>
    </div>
  )
}