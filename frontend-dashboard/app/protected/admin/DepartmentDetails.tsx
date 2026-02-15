'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DepartmentDetails({ departmentId }: { departmentId: string | null }) {
  const supabase = createClient();

  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

  const getRisk = (risk: number) => {
    if (risk < 0.4) return { label: 'Low', color: 'bg-green-100 text-green-700' };
    if (risk < 0.7) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'High', color: 'bg-red-100 text-red-700' };
  };

  useEffect(() => {
    if (!departmentId) return;

    const fetchData = async () => {
      setLoading(true);

      // 👥 Patients + timestamp
      const { data: patientData } = await supabase
        .from('ai_predictions')
        .select(`
          risk_level,
          triage_sessions (
            triage_timestamp,
            patients (
              age,
              gender,
              users ( name )
            )
          )
        `)
        .eq('recommended_department_id', departmentId)
        .order('risk_level', { ascending: false });

      // 🩺 Doctors
      const { data: doctorData } = await supabase
        .from('doctors')
        .select(`
          doctor_id,
          specialization,
          experience_years,
          users ( name, email )
        `)
        .eq('department_id', departmentId);

      setPatients(patientData || []);
      setDoctors(doctorData || []);
      setLoading(false);
    };

    fetchData();
  }, [departmentId]);

  if (!departmentId) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200 h-96 flex items-center justify-center text-slate-400">
        Select a department to view details
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-3xl bg-white border border-slate-200 h-96 flex items-center justify-center text-slate-400">
        Loading department data...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 👥 Patients */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Patients</h2>

        <div className="space-y-3 max-h-72 overflow-y-auto">
          {patients.length === 0 && <p className="text-slate-400 text-sm">No patients assigned</p>}

          {patients.map((p, i) => {
            const risk = getRisk(p.risk_level);
            const triage = p.triage_sessions;
            const patient = triage?.patients;

            return (
              <button
                key={i}
                onClick={() => setSelectedPatient({ ...patient, risk, triage })}
                className="w-full text-left flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
              >
                <div>
                  <p className="font-medium text-slate-800">{patient?.users?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500">
                    {patient?.gender} • {patient?.age} yrs
                  </p>
                </div>

                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${risk.color}`}>
                  {risk.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🩺 Doctors */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Doctors</h2>

        <div className="space-y-3">
          {doctors.length === 0 && <p className="text-slate-400 text-sm">No doctors in department</p>}

          {doctors.map((doc) => (
            <div key={doc.doctor_id} className="p-3 rounded-xl bg-slate-50">
              <p className="font-medium text-slate-800">{doc.users?.name || 'Doctor'}</p>
              <p className="text-xs text-slate-500">
                {doc.specialization} • {doc.experience_years} yrs exp
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 🧾 Patient Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Patient Details</h3>

            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Name:</span> {selectedPatient.users?.name}</p>
              <p><span className="font-medium">Gender:</span> {selectedPatient.gender}</p>
              <p><span className="font-medium">Age:</span> {selectedPatient.age}</p>
              <p>
                <span className="font-medium">Risk:</span>{' '}
                <span className={`px-2 py-0.5 rounded-full text-xs ${selectedPatient.risk.color}`}>
                  {selectedPatient.risk.label}
                </span>
              </p>
              <p>
                <span className="font-medium">Submitted At:</span>{' '}
                {selectedPatient.triage?.triage_timestamp
                  ? new Date(selectedPatient.triage.triage_timestamp).toLocaleString()
                  : 'N/A'}
              </p>
            </div>

            <button
              onClick={() => setSelectedPatient(null)}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
