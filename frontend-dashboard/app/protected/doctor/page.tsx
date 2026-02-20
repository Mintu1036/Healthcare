'use client'

import { useState } from 'react'
import { LogoutButton } from "@/components/logout-button"
import { Users, Stethoscope, FileText } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine
} from 'recharts'

interface ShapData {
  base_value: number;
  prediction: number;
  features: { name: string; value: number; contribution: number }[];
}

interface Patient {
  id: string
  name: string
  age: number
  gender: string
  risk: { label: string; color: string; score: number }
  triageTime: string
  vitals: {
    systolic: number
    diastolic: number
    hr: number
    temp: number
  }
  explainability: string
  shap: ShapData // 👈 Added actual SHAP data structure
}

const patients: Patient[] = [
  {
    id: '1',
    name: 'Ravi Kumar',
    age: 61,
    gender: 'Male',
    risk: { label: 'High', color: 'bg-red-100 text-red-700', score: 86 },
    triageTime: '2026-02-15T10:12:00',
    vitals: { systolic: 172, diastolic: 104, hr: 126, temp: 37.2 },
    explainability: 'Severe hypertension and tachycardia detected. Critical risk elevation driven by cardiac stress markers.',
    shap: {
      "base_value": 0.22,
      "prediction": 0.86,
      "features": [
        { "name": "Heart_Rate", "value": 126, "contribution": 0.31 },
        { "name": "Systolic_BP", "value": 172, "contribution": 0.28 },
        { "name": "Diastolic_BP", "value": 104, "contribution": 0.14 },
        { "name": "Age", "value": 61, "contribution": 0.09 },
        { "name": "Temperature", "value": 37.2, "contribution": 0.02 },
        { "name": "Sex", "value": 1, "contribution": 0.02 }
      ]
    }
  },
  {
    id: '2',
    name: 'Priya Sharma',
    age: 54,
    gender: 'Female',
    risk: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700', score: 71 },
    triageTime: '2026-02-15T10:25:00',
    vitals: { systolic: 148, diastolic: 92, hr: 102, temp: 36.9 },
    explainability: 'Elevated blood pressure and age factors contribute to moderate risk. Requires observation.',
    shap: {
      "base_value": 0.22,
      "prediction": 0.71,
      "features": [
        { "name": "Systolic_BP", "value": 148, "contribution": 0.18 },
        { "name": "Heart_Rate", "value": 102, "contribution": 0.17 },
        { "name": "Diastolic_BP", "value": 92, "contribution": 0.08 },
        { "name": "Age", "value": 54, "contribution": 0.05 },
        { "name": "Temperature", "value": 36.9, "contribution": 0.01 },
        { "name": "Sex", "value": 0, "contribution": 0.00 }
      ]
    }
  },
  {
    id: '3',
    name: 'Arjun Nair',
    age: 32,
    gender: 'Male',
    risk: { label: 'Low', color: 'bg-green-100 text-green-700', score: 46 },
    triageTime: '2026-02-15T10:40:00',
    vitals: { systolic: 124, diastolic: 80, hr: 96, temp: 36.7 },
    explainability: 'Vitals are largely within normal limits. Younger age and normal temperature act as protective factors.',
    shap: {
      "base_value": 0.22,
      "prediction": 0.46,
      "features": [
        { "name": "Heart_Rate", "value": 96, "contribution": 0.11 },
        { "name": "Systolic_BP", "value": 124, "contribution": 0.02 },
        { "name": "Diastolic_BP", "value": 80, "contribution": 0.01 },
        { "name": "Sex", "value": 1, "contribution": 0.00 },
        { "name": "Temperature", "value": 36.7, "contribution": -0.01 },
        { "name": "Age", "value": 32, "contribution": -0.04 }
      ]
    }
  },
]

// 📊 Updated SHAP Waterfall Component using provided JSON data
const ShapWaterfall = ({ shap }: { shap: ShapData }) => {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          AI Risk Drivers (SHAP Contributions)
        </h3>
        <span className="text-[10px] text-slate-400 font-medium italic">
          Base: {shap.base_value} → Prediction: {shap.prediction}
        </span>
      </div>

      <div className="w-full h-72 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={shap.features} 
            layout="vertical" 
            margin={{ left: 20, right: 40, top: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" domain={['dataMin - 0.1', 'dataMax + 0.1']} hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              fontSize={11} 
              width={100}
              tick={{ fill: '#64748b', fontWeight: 600 }}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700">
                      <p className="font-bold mb-1 text-blue-400">{data.name}</p>
                      <div className="flex justify-between gap-4">
                        <span className="opacity-70">Observed Value:</span>
                        <span className="font-mono">{data.value}</span>
                      </div>
                      <div className="flex justify-between gap-4 mt-1">
                        <span className="opacity-70">Contribution:</span>
                        <span className={`font-bold ${data.contribution > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {data.contribution > 0 ? '+' : ''}{data.contribution.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={2} />
            <Bar dataKey="contribution" radius={[0, 4, 4, 0]} barSize={18}>
              {shap.features.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.contribution > 0 ? '#ef4444' : '#10b981'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function DoctorDashboard() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(patients[0])

  const handleOpenEHR = (e: React.MouseEvent, patientName: string) => {
    e.stopPropagation();
    window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank');
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Stethoscope className="text-blue-600" />
            <h1 className="text-lg font-bold">Clinical Triage</h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {patients.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedPatient(p)}
              className={`group relative w-full text-left p-4 rounded-2xl transition cursor-pointer border ${
                selectedPatient?.id === p.id
                  ? 'bg-blue-50 border-blue-200 shadow-sm'
                  : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
              }`}
            >
              <div className="pr-12">
                <p className="font-bold text-slate-800">{p.name}</p>
                <p className="text-xs text-slate-500">
                  {p.gender} • {p.age} yrs
                </p>
                <span className={`mt-2 inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${p.risk.color}`}>
                  {p.risk.label} Risk
                </span>
              </div>
              
              <button 
                onClick={(e) => handleOpenEHR(e, p.name)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white transition-colors"
              >
                <FileText size={18} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        {!selectedPatient ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Users size={48} className="mb-4 opacity-20" />
            <p>Select a patient to view clinical insights</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <Users size={28} />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight">{selectedPatient.name}</h2>
                  <div className="flex gap-2 mt-1">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${selectedPatient.risk.color}`}>
                      {selectedPatient.risk.label} Priority
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={(e) => handleOpenEHR(e, selectedPatient.name)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl font-bold text-sm hover:bg-slate-50 transition shadow-sm"
              >
                <FileText size={18} className="text-blue-600" />
                View Full EMR
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1 bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold uppercase text-slate-400">Demographics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Gender</span><span className="font-semibold">{selectedPatient.gender}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Age</span><span className="font-semibold">{selectedPatient.age}</span></div>
                  <div className="pt-2 border-t border-slate-50">
                    <p className="text-xs text-slate-500 mb-1">Triage Recorded</p>
                    <p className="font-medium text-xs">{new Date(selectedPatient.triageTime).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-4">Current Vitals</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-slate-500 text-[10px] font-bold uppercase">BP</p>
                    <p className="text-lg font-black text-slate-800">
                      {selectedPatient.vitals.systolic}/{selectedPatient.vitals.diastolic}
                    </p>
                    <p className="text-[10px] text-slate-400">mmHg</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-slate-500 text-[10px] font-bold uppercase">HR</p>
                    <p className="text-lg font-black text-slate-800">{selectedPatient.vitals.hr}</p>
                    <p className="text-[10px] text-slate-400">bpm</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-slate-500 text-[10px] font-bold uppercase">Temp</p>
                    <p className="text-lg font-black text-slate-800">{selectedPatient.vitals.temp}</p>
                    <p className="text-[10px] text-slate-400">°C</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-100 h-fit">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" />
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                    AI Clinical Explanation
                  </p>
                </div>
                <p className="text-lg font-medium leading-relaxed italic">
                  "{selectedPatient.explainability}"
                </p>
              </div>

              {/* Render updated SHAP chart using patient's real data */}
              <ShapWaterfall shap={selectedPatient.shap} />
            </div>

            {/* <div className="flex gap-4 pt-4">
              <button className="flex-1 py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-black transition-all shadow-lg shadow-slate-200">
                Begin Examination
              </button>
              <button className="px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition">
                Mark Treated
              </button>
            </div> */}
          </div>
        )}
      </main>
    </div>
  )
}