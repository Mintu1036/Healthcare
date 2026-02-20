'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Users } from 'lucide-react';

interface Doctor {
  doctor_id: string;
  specialization: string;
  experience_years: number;
  users: { name: string };
}

interface PatientRow {
  risk_level: number;
  shap_values: any;
  explainability: string;
  triage_sessions: {
    triage_id: string;
    triage_timestamp: string;
    patients: {
      age: number;
      gender: string;
      users: { name: string };
    };
  };
}

interface PatientModal {
  name: string;
  age: number;
  gender: string;
  triage_id: string;
  triage_timestamp: string;
  risk: { label: string; color: string };
  shap?: any;
  explainability?: string;
}

export default function DepartmentDetails({ departmentId }: { departmentId: string | null }) {
  const supabase = createClient();

  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [assignedDoctors, setAssignedDoctors] = useState<Record<string, Doctor>>({});
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientModal | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null); // 👈 Track selected doctor

  const getRisk = (risk: number) => {
    if (risk < 0.3) return { label: 'Low', color: 'bg-green-100 text-green-700' };
    if (risk < 0.7) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'High', color: 'bg-red-100 text-red-700' };
  };

  useEffect(() => {
    if (!departmentId) return;

    const fetchData = async () => {
      setLoading(true);
      setSelectedDoctorId(null); // Reset filter when department changes

      const { data: patientData } = await supabase
        .from('ai_predictions')
        .select(`
          risk_level,
          shap_values,
          explainability,   
          triage_sessions (
            triage_id,
            triage_timestamp,
            patients (
              age,
              gender,
              users ( name )
            )
          )
        `)
        .eq('recommended_department_id', departmentId);

      const { data: doctorData } = await supabase
        .from('doctors')
        .select(`
          doctor_id,
          specialization,
          experience_years,
          users ( name )
        `)
        .eq('department_id', departmentId);

      setPatients((patientData as any) || []);
      setDoctors((doctorData as any) || []);
      setLoading(false);
    };

    fetchData();
  }, [departmentId, supabase]);

  useEffect(() => {
    if (!patients.length || !doctors.length) return;

    const sortedDoctors = [...doctors].sort(
      (a, b) => (b.experience_years || 0) - (a.experience_years || 0)
    );

    const sortedPatients = [...patients].sort(
      (a, b) => b.risk_level - a.risk_level
    );

    const assignments: Record<string, Doctor> = {};

    sortedPatients.forEach((p, index) => {
      const triageId = p.triage_sessions?.triage_id;
      if (!triageId) return;

      const doctor = sortedDoctors[index % sortedDoctors.length];
      assignments[triageId] = doctor;
    });

    setAssignedDoctors(assignments);
  }, [patients, doctors]);

  if (!departmentId) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200 h-96 flex items-center justify-center text-slate-400">
        Select a department to view details
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200 h-96 flex items-center justify-center text-slate-400 animate-pulse">
        Loading department data...
      </div>
    );
  }

  const ShapWaterfall = ({ shap }: { shap: any }) => {
    if (!shap?.features) return null;
    const max = Math.max(...shap.features.map((f: any) => Math.abs(f.contribution))) || 1;

    return (
      <div className="mt-6">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          AI Explainability {shap.explainability || ''}
        </p>
        <div className="space-y-2">
          {shap.features.map((f: any, i: number) => {
            const width = (Math.abs(f.contribution) / max) * 100;
            const positive = f.contribution > 0;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-24 text-[11px] text-slate-500 truncate">{f.name}</div>
                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full ${positive ? 'bg-red-400' : 'bg-blue-400'}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
                <div className="w-16 text-[11px] font-semibold text-slate-600 text-right">
                  {f.contribution.toFixed(3)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 🔍 Filter logic
  const filteredPatients = selectedDoctorId 
    ? patients.filter(p => assignedDoctors[p.triage_sessions?.triage_id]?.doctor_id === selectedDoctorId)
    : patients;

  return (
    <div className="space-y-8 ">
      {/* 👥 Patients */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {selectedDoctorId 
              ? `Patients for Dr. ${doctors.find(d => d.doctor_id === selectedDoctorId)?.users.name}` 
              : 'Current Patients'}
          </h2>
          {selectedDoctorId && (
            <button 
              onClick={() => setSelectedDoctorId(null)}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              Show All
            </button>
          )}
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
          {filteredPatients.length === 0 && (
            <p className="text-slate-400 text-sm">No patients assigned</p>
          )}

          {filteredPatients.map((p, i) => {
            const risk = getRisk(p.risk_level);
            const triage = p.triage_sessions;
            const patient = triage?.patients;
            const assignedDoc = assignedDoctors[triage?.triage_id];

            return (
              <button
                key={i}
                onClick={() =>
                  setSelectedPatient({
                    name: patient?.users?.name || 'Unknown',
                    age: patient?.age,
                    gender: patient?.gender,
                    triage_id: triage?.triage_id,
                    triage_timestamp: triage?.triage_timestamp,
                    risk,
                    shap: p.shap_values,
                    explainability: p.explainability,
                  })
                }
                className="w-full text-left flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition"
              >
                <div>
                  <p className="font-bold text-slate-800">{patient?.users?.name || 'Unknown Patient'}</p>
                  <p className="text-xs text-slate-500">{patient?.gender} • {patient?.age} yrs</p>
                  {assignedDoc && (
                    <p className="text-[10px] text-blue-600 font-semibold mt-1">Dr. {assignedDoc.users?.name}</p>
                  )}
                </div>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${risk.color}`}>{risk.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🩺 Doctors */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Department Doctors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {doctors.length === 0 && (
            <p className="text-slate-400 text-sm col-span-2">No doctors in department</p>
          )}

          {doctors.map((doc) => (
            <button 
              key={doc.doctor_id} 
              onClick={() => setSelectedDoctorId(doc.doctor_id === selectedDoctorId ? null : doc.doctor_id)}
              className={`p-4 rounded-2xl text-left transition border-2 ${
                selectedDoctorId === doc.doctor_id 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-slate-50 border-transparent hover:bg-slate-100'
              }`}
            >
              <p className="font-bold text-slate-800">{doc.users?.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {doc.specialization} • {doc.experience_years}y exp
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* 🧾 Modal (Remains unchanged) */}
      {selectedPatient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedPatient(null)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10">
            <button onClick={() => setSelectedPatient(null)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full">
              <X size={18} />
            </button>
            <div className="flex items-center gap-4 mb-10">
              <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600">
                <Users size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">{selectedPatient.name}</h3>
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${selectedPatient.risk.color}`}>
                  {selectedPatient.risk.label} Priority
                </span>
              </div>
            </div>
            <div className="space-y-3 text-sm mb-6">
              <p><strong>Gender:</strong> {selectedPatient.gender}</p>
              <p><strong>Age:</strong> {selectedPatient.age}</p>
              <p><strong>Submitted:</strong> {new Date(selectedPatient.triage_timestamp).toLocaleString()}</p>
              <p><strong>Assigned Doctor:</strong> {assignedDoctors[selectedPatient.triage_id]?.users?.name || 'Pending'}</p>
            </div>
            {selectedPatient.explainability && (
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 mb-5">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">AI Clinical Explanation</p>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedPatient.explainability}</p>
              </div>
            )}
            <ShapWaterfall shap={selectedPatient.shap} />
            <button onClick={() => setSelectedPatient(null)} className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold mt-5">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}