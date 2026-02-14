import Link from "next/link";
import { ChevronRight, Stethoscope, User, ShieldCheck } from "lucide-react";

export function Hero() {
  const roles = [
    { 
      name: "Doctor", 
      href: "/auth/doctor-sign-up", 
      icon: <Stethoscope size={22} />,
      color: "bg-blue-50 text-blue-600" 
    },
    { 
      name: "Patient", 
      href: "/auth/patient-sign-up", 
      icon: <User size={22} />,
      color: "bg-indigo-50 text-indigo-600" 
    },
    { 
      name: "Administrator", 
      href: "/auth/admin-sign-up", 
      icon: <ShieldCheck size={22} />,
      color: "bg-slate-50 text-slate-600" 
    },
  ];

  return (
    <section className="flex flex-col items-center justify-center py-24 px-6 bg-[#fcfdfe]">
      {/* Header */}
      <div className="max-w-xl text-center space-y-3 mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Welcome to <span className="text-blue-600 text-shadow-sm">Portal</span>
        </h1>
        <p className="text-slate-500 text-base font-medium">
          Select your role to access the dashboard
        </p>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {roles.map((role) => (
          <Link key={role.name} href={role.href} className="group">
            <div className="h-full rounded-[24px] border border-slate-100 bg-white p-8 flex flex-col items-start gap-6 transition-all duration-300 hover:border-blue-200 hover:-translate-y-1">
              
              {/* Icon Container */}
              <div className={`p-4 rounded-2xl transition-transform duration-300 group-hover:scale-110 ${role.color}`}>
                {role.icon}
              </div>

              <div className="flex items-center justify-between w-full">
                <h2 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {role.name}
                </h2>
                
                <div className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                  <ChevronRight size={20} />
                </div>
              </div>
              
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}