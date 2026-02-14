import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Register() {
  const { role } = useParams()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // insert profile
    await supabase.from('users').insert({
      auth_user_id: data.user.id,
      name,
      email,
      mobile_number: mobile,
      role: role.toUpperCase()
    })

    navigate(`/${role}`)
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-[360px]">
        <h2 className="text-xl font-bold mb-4 capitalize">{role} Register</h2>

        <input className="input" placeholder="Name" onChange={e => setName(e.target.value)} />
        <input className="input" placeholder="Mobile Number" onChange={e => setMobile(e.target.value)} />
        <input className="input" placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input type="password" className="input" placeholder="Password" onChange={e => setPassword(e.target.value)} />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button onClick={handleRegister} className="btn-primary mt-4 w-full">
          {loading ? 'Loading...' : 'Register'}
        </button>
      </div>
    </div>
  )
}
