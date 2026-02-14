import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Suspense } from "react";
import { Activity } from "lucide-react"; // Healthcare-style logo icon

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col bg-[#fcfdfe]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-blue-600 p-1.5 rounded-lg transition-transform group-hover:rotate-3">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight text-lg">
                Health<span className="text-blue-600">Portal</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Suspense fallback={<div className="w-20 h-8 bg-slate-50 animate-pulse rounded-lg" />}>
              <AuthButton />
            </Suspense>
          </div>
          
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto p-6 md:p-8">
        <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </div>

      {/* Simplified Footer */}
      <footer className="w-full border-t border-slate-100 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-slate-400">
            &copy; 2026 HealthPortal. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6">
            <ThemeSwitcher />
            <div className="h-4 w-[1px] bg-slate-200" />
            <a
              href="https://supabase.com"
              target="_blank"
              className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors"
              rel="noreferrer"
            >
              Powered by Supabase
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}