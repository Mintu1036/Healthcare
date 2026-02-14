import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight } from "lucide-react";

export default function PatientSignUpPage() {
  async function signUpPatient(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const mobile = formData.get('mobile') as string
    const age = formData.get('age') as string
    const gender = formData.get('gender') as string

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    })

    if (authError) redirect(`/auth/error?message=${authError.message}`)
    const authUserId = authData.user?.id
    if (!authUserId) redirect(`/auth/error?message=Auth user not created`)

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .insert({
        auth_user_id: authUserId,
        name,
        email,
        mobile_number: mobile,
        role: 'PATIENT'
      })
      .select()
      .single()

    if (userError) redirect(`/auth/error?message=${userError.message}`)

    const { error: patientError } = await supabase
      .from('patients')
      .insert({
        user_id: userRow.user_id,
        age: Number(age),
        gender
      })

    if (patientError) redirect(`/auth/error?message=${patientError.message}`)

    redirect('/protected/patient')
  }

  const inputStyles = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm shadow-sm";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fcfdfe] px-6">
      <div className="w-full max-w-[440px]">
        
        {/* Header Section */}
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-3xl font-semibold text-slate-800">
            Patient <span className="text-blue-600">Sign Up</span>
          </h1>
          <p className="text-slate-500 text-sm">Join the health portal to manage your care</p>
        </div>

        {/* Form Card */}
        <form 
          action={signUpPatient} 
          className="bg-white border border-slate-100 p-8 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.02)] space-y-4"
        >
          <div className="space-y-4">
            <input name="name" placeholder="Full Name" className={inputStyles} required />
            
            <input name="email" type="email" placeholder="Email Address" className={inputStyles} required />
            
            <div className="grid grid-cols-2 gap-3">
              <input name="mobile" placeholder="Mobile Number" className={inputStyles} required />
              <input name="password" type="password" placeholder="Password" className={inputStyles} required />
            </div>

            <div className="h-[1px] bg-slate-50 my-2" />

            <div className="grid grid-cols-2 gap-3">
              <input name="age" type="number" placeholder="Age" className={inputStyles} required />
              
              <select name="gender" className={inputStyles} required>
                <option value="" disabled selected>Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <button className="group mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
            Create Account
            <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
          </button>

          <p className="text-sm text-center text-slate-500 pt-4">
            Already have an account?{' '}
            <Link href="/auth/patient-login" className="text-blue-600 font-medium hover:underline">
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