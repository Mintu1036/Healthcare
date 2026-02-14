import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const { role } = useParams()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    // 🔒 Hardcoded admin login
    if (role === 'administrator') {
      if (email === 'admin@triage.com' && password === 'admin123') {
        navigate('/administrator')
      } else {
        setError('Invalid admin credentials')
      }
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // fetch role from users table
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', data.user.id)
      .single()

    navigate(`/${profile.role.toLowerCase()}`)
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-[360px]">
        <h2 className="text-xl font-bold mb-4 capitalize">{role} Login</h2>

        <input
          className="input"
          placeholder="Email"
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="input"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleLogin}
          className="btn-primary mt-4 w-full"
        >
          {loading ? 'Loading...' : 'Login'}
        </button>

        {role !== 'administrator' && (
          <p className="text-sm mt-4 text-center">
            No account?{' '}
            <Link to={`/register/${role}`} className="text-indigo-600">
              Register
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
