'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PatientDashboard() {
  const supabase = createClient()

  const [reportUrl, setReportUrl] = useState<string | null>(null)
  const [patientId, setPatientId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [filePath, setFilePath] = useState<string | null>(null)

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
        .select('patient_id, ehr_report_url')
        .eq('user_id', profile?.user_id)
        .single()

      if (patient) {
        setPatientId(patient.patient_id)
        setReportUrl(patient.ehr_report_url)

        // store file path for deletion later
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
    setUploading(true)

    const newFilePath = `ehr/${patientId}-${Date.now()}-${file.name}`

    // 🧹 delete old file if exists
    if (filePath) {
      await supabase.storage.from('emrehr').remove([filePath])
    }

    // 1️⃣ Upload new file
    const { error: uploadError } = await supabase.storage
      .from('emrehr')
      .upload(newFilePath, file)

    if (uploadError) {
      alert(uploadError.message)
      setUploading(false)
      return
    }

    // 2️⃣ Get public URL
    const { data } = supabase.storage
      .from('emrehr')
      .getPublicUrl(newFilePath)

    const publicUrl = data.publicUrl

    // 3️⃣ Update DB
    const { error: updateError } = await supabase
      .from('patients')
      .update({ ehr_report_url: publicUrl })
      .eq('patient_id', patientId)

    if (updateError) {
      alert(updateError.message)
    } else {
      setReportUrl(publicUrl)
      setFilePath(newFilePath)
      await fetch('http://localhost:8000/extract-ehr', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileUrl: publicUrl,
    patientId
  })
})
    }


    

    setUploading(false)
  }

  const handleDelete = async () => {
    if (!patientId || !filePath) return

    setUploading(true)

    // 🧹 delete file from storage
    await supabase.storage.from('emrehr').remove([filePath])

    // 🗑️ remove URL from DB
    const { error } = await supabase
      .from('patients')
      .update({ ehr_report_url: null })
      .eq('patient_id', patientId)

    if (error) {
      alert(error.message)
    } else {
      setReportUrl(null)
      setFilePath(null)
    }

    setUploading(false)
  }

  return (
    <div className="p-6">
      {reportUrl ? (
        <div className="max-w-md border rounded-xl p-4 bg-white shadow-sm">
  <h2 className="text-lg font-semibold mb-3">EHR/EMR</h2>

  <div className="flex items-center justify-between border rounded-lg p-3 bg-slate-50">
    <div className="flex items-center gap-3">
      <span className="text-2xl">📄</span>
      <div>
        <p className="text-sm font-medium">EHR Report</p>
        <p className="text-xs text-slate-500">Uploaded successfully</p>
      </div>
    </div>

    <a
      href={reportUrl}
      target="_blank"
      className="text-blue-600 text-sm font-semibold hover:underline"
    >
      View
    </a>
  </div>

  <div className="flex gap-3 mt-4">
    <label className="btn-primary cursor-pointer">
      Replace
      <input
        type="file"
        accept=".pdf,.jpg,.png"
        onChange={handleUpload}
        className="hidden"
      />
    </label>

    <button
      onClick={handleDelete}
      className="bg-red-500 text-white px-4 py-2 rounded-lg"
    >
      Delete
    </button>
  </div>

  {uploading && <p className="text-sm text-slate-500 mt-2">Processing...</p>}
</div>

      ) : (
        <div>
          <h1 className="text-2xl font-bold">Patient Dashboard</h1>
          <p className="mt-4 mb-4">No medical report available yet.</p>

          <input
            type="file"
            accept=".pdf,.jpg,.png"
            onChange={handleUpload}
            className="mb-3"
          />

          {uploading && <p className="text-sm text-slate-500">Uploading...</p>}
        </div>  
      )}
    </div>
  )
}
