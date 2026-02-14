import { useNavigate } from 'react-router-dom'

export default function RoleSelect() {
  const navigate = useNavigate()

  const roles = [
    { label: 'Doctor', path: 'doctor' },
    { label: 'Patient', path: 'patient' },
    { label: 'Administrator', path: 'administrator' }
  ]

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-[360px] text-center">
        <h1 className="text-2xl font-bold mb-6">AI Smart Triage</h1>
        <p className="text-gray-500 mb-6">Select your role</p>

        <div className="space-y-4">
          {roles.map(r => (
            <button
              key={r.path}
              onClick={() => navigate(`/login/${r.path}`)}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
