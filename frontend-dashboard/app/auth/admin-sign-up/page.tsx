import { createClient } from '@/lib/supabase/server'
import Link from 'next/dist/client/link'
import { redirect } from 'next/navigation'
import { ChevronRight, ShieldCheck } from "lucide-react";

export default async function AdminSignUpPage() {
  async function signUpAdmin(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const mobile = formData.get('mobile') as string

    // 1️⃣ Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    })

    if (authError) redirect(`/auth/error?message=${authError.message}`)

    const authUserId = authData.user?.id
    if (!authUserId) redirect(`/auth/error?message=Auth user not created`)

    // 2️⃣ Insert into users table with ADMIN role
    const { error: userError } = await supabase.from('users').insert({
      auth_user_id: authUserId,
      name,
      email,
      mobile_number: mobile,
      role: 'ADMIN'
    })

    if (userError) redirect(`/auth/error?message=${userError.message}`)

    redirect('/protected/admin')
  }

  const inputStyles = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm shadow-sm";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fcfdfe] px-6">
      <div className="w-full max-w-[420px]">
        
        {/* Header - matching your clean/bold reference */}
        <div className="text-center mb-10 space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-slate-800">
            Admin <span className="text-blue-600">Portal</span>
          </h1>
          <p className="text-slate-500 text-sm">Register a new administrative account</p>
        </div>

        {/* Form Card */}
        <form 
          action={signUpAdmin} 
          className="bg-white border border-slate-100 p-8 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.02)] space-y-4"
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-wider">Full Name</label>
              <input name="name" placeholder="John Doe" className={inputStyles} required />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-wider">Contact Number</label>
              <input name="mobile" placeholder="+1 (555) 000-0000" className={inputStyles} required />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-wider">Work Email</label>
              <input name="email" type="email" placeholder="admin@hospital.com" className={inputStyles} required />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-wider">Security Password</label>
              <input name="password" type="password" placeholder="••••••••" className={inputStyles} required />
            </div>
          </div>

          <button className="group mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
            Create Admin Account
            <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
          </button>

          <p className="text-sm text-center text-slate-500 pt-4">
            Already registered?{' '}
            <Link href="/auth/administrator-login" className="text-blue-600 font-medium hover:underline">
              Login
            </Link>
          </p>
        </form>

        {/* Home Navigation */}
        <div className="text-center mt-8">
           <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              ← Back to role selection
            </Link>
        </div>
      </div>
    </div>
  )
}