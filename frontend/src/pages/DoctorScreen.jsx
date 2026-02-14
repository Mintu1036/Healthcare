import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function DoctorScreen() {
  const navigate = useNavigate()

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

      <h1 className="text-2xl font-bold mt-4">Doctor Dashboard</h1>
    </div>
  )
}
