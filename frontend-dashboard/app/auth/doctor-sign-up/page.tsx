import { createClient } from '@/lib/supabase/server'
import Link from 'next/dist/client/link'
import { redirect } from 'next/navigation'
import { ChevronRight } from "lucide-react";

export default async function DoctorSignUpPage() {
  const supabase = await createClient()

  // fetch departments on server
  const { data: departments } = await supabase
    .from('departments')
    .select('department_id, name')

  async function signUpDoctor(formData: FormData) {
    'use server'
    const supabase = await createClient()

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const mobile = formData.get('mobile') as string
    const specialization = formData.get('specialization') as string
    const department_id = formData.get('department_id') as string
    const experience_years = formData.get('experience_years') as string

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
        role: 'DOCTOR'
      })
      .select()
      .single()

    if (userError) redirect(`/auth/error?message=${userError.message}`)

    const { error: doctorError } = await supabase
      .from('doctors')
      .insert({
        user_id: userRow.user_id,
        specialization,
        department_id,
        experience_years: Number(experience_years)
      })

    if (doctorError) redirect(`/auth/error?message=${doctorError.message}`)

    redirect('/protected') 
  }

  // Common Tailwind classes for inputs to match the Hero style
  const inputStyles = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm shadow-sm";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fcfdfe] px-6">
      <div className="w-full max-w-[440px]">
        {/* Header matching Hero style */}
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-3xl font-semibold text-slate-800">
            Doctor <span className="text-blue-600">Registration</span>
          </h1>
          <p className="text-slate-500 text-sm">Create your provider account</p>
        </div>

        <form action={signUpDoctor} className="bg-white border border-slate-100 p-8 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.02)] space-y-4">
          
          <div className="space-y-4">
            <input name="name" placeholder="Full Name" className={inputStyles} required />
            <div className="grid grid-cols-2 gap-3">
               <input name="mobile" placeholder="Mobile" className={inputStyles} required />
               <input name="experience_years" type="number" placeholder="Experience (Yrs)" className={inputStyles} required />
            </div>
            <input name="email" type="email" placeholder="Email Address" className={inputStyles} required />
            <input name="password" type="password" placeholder="Password" className={inputStyles} required />
            
            <div className="h-[1px] bg-slate-100 my-2" />
            
            <input name="specialization" placeholder="Specialization (e.g. Cardiology)" className={inputStyles} required />
            
            <select name="department_id" className={inputStyles} required>
              <option value="" disabled selected>Select Department</option>
              {departments?.map((dep) => (
                <option key={dep.department_id} value={dep.department_id}>
                  {dep.name}
                </option>
              ))}
            </select>
          </div>

          <button className="group mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
            Complete Sign Up
            <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
          </button>

          <p className="text-sm text-center text-slate-500 pt-4">
            Already have an account?{' '}
            <Link href="/auth/doctor-login" className="text-blue-600 font-medium hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}