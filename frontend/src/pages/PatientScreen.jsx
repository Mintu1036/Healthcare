import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function PatientScreen() {
  const navigate = useNavigate()
  const [report, setReport] = useState("");

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="p-6">
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded-lg"
      >
        Logout
      </button>

      <h1 className="text-2xl font-bold mt-4">
        <h1>{report === "" ? "No report available yet." : `Your Report: ${report}`}</h1>
        <h1>Patient Dashbof,sdfard</h1>
      </h1>
    </div>
  )
}
