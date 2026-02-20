'use client';
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Settings, Bell, Menu, X, Search, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import DepartmentDetails from './DepartmentDetails';

export default function AdminDashboard() {
  const [open, setOpen] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('department_id, name')
        .order('name');
      if (!error && data) setDepartments(data);
    };
    fetchDepartments();
  }, []);


  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('patients')
          .select('name, email')
          .eq('user_id', user.id)
          .single();
        if (!error && data) {
          setUser(data);
        }
      } else {
        console.log("No user logged in");
      }
    };
    fetchUser();

  }, [])

  const filtered = departments.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 transition-all duration-300 lg:relative lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 pb-2">
            {/* <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
                  <LayoutDashboard size={18} className="text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight">Skyline</span>
              </div>
              <button onClick={() => setOpen(false)} className="lg:hidden p-1 text-slate-400">
                <X size={20} />
              </button>
            </div> */}

            {/* 🔍 Refined Search Bar */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search departments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              />
            </div>
          </div>

          {/* 📋 Departments List */}
          <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
            <p className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Departments</p>
            <nav className="space-y-1">
              {filtered.map((dept) => (
                <button
                  key={dept.department_id}
                  onClick={() => setSelectedId(dept.department_id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${selectedId === dept.department_id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                    }`}
                >
                  <span className="truncate">{dept.name}</span>
                  <ChevronRight size={14} className={`transition-transform ${selectedId === dept.department_id ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                </button>
              ))}
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 overflow-hidden">


        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-6xl mx-auto">
           

            {/* Placeholder for Charts */}
            <div className="">
              <DepartmentDetails departmentId={selectedId} />
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}