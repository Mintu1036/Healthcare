import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Hero } from '@/components/hero'

export default async function Home() {
  const supabase = await createClient()

  // 🔐 Get logged-in user (from cookies)
  const {
    data: { user }
  } = await supabase.auth.getUser()

  // 👉 If logged in → fetch role and redirect
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    const role = profile?.role

    if (role === 'ADMIN') redirect('/protected/admin')
    if (role === 'DOCTOR') redirect('/protected/doctor')
    if (role === 'PATIENT') redirect('/protected/patient')
  }

  // 🧭 Not logged in → show landing page
  return (
    <main className="min-h-screen flex flex-col items-center">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm font-semibold">
          <Link href="/">Nalam AI</Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center gap-10 p-5">
        <Hero />

        {/* Role login buttons */}
        {/* <div className="flex gap-4">
          <Link href="/auth/doctor-login" className="btn-primary">
            Doctor Login
          </Link>

          <Link href="/auth/patient-login" className="btn-primary">
            Patient Login
          </Link>

          <Link href="/auth/admin-login" className="btn-primary">
            Admin Login
          </Link>
        </div> */}
      </div>
    </main>
  )
}
