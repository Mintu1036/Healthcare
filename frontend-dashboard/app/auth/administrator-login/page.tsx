import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  async function loginAdmin(formData: FormData) {
    'use server'

    const supabase = await createClient()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) redirect(`/auth/error?message=${error.message}`)

    const userId = data.user?.id
    if (!userId) redirect(`/auth/error?message=User not found`)

    const { data: profile, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', userId)
      .single()

    if (roleError) redirect(`/auth/error?message=${roleError.message}`)

    if (profile.role !== 'ADMIN') {
      redirect(`/auth/error?message=Access denied: Not an admin`)
    }

    redirect('/protected/admin')
  }

  const inputStyles = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm shadow-sm";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fcfdfe] px-6">
      <div className="w-full max-w-[400px]">
        
        {/* Header matching the series */}
        <div className="text-center mb-10 space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-slate-800">
            Admin <span className="text-blue-600">Login</span>
          </h1>
          <p className="text-slate-500 text-sm">System management access</p>
        </div>

        {/* Login Card */}
        <form 
          action={loginAdmin} 
          className="bg-white border border-slate-100 p-8 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.02)] space-y-6"
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-wider">Admin Email</label>
              <input
                name="email"
                type="email"
                placeholder="admin@hospital.com"
                className={inputStyles}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 ml-1 uppercase tracking-wider">Password</label>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                className={inputStyles}
                required
              />
            </div>
          </div>

          <button className="group w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
            Authorize & Sign In
            <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
          </button>

          <div className="pt-2 flex flex-col items-center gap-3">
            <p className="text-sm text-slate-500">
              Need an admin account?{' '}
              <Link href="/auth/admin-sign-up" className="text-blue-600 font-medium hover:underline">
                Register
              </Link>
            </p>
            <div className="h-[1px] w-8 bg-slate-100" />
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Back to role selection
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}