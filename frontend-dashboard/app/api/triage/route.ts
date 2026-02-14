export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const {
      patient_id,
      symptoms,
      heart_rate,
      systolic_bp,
      diastolic_bp,
      temperature
    } = body

    // 1️⃣ store triage session
    const { data: triage, error: triageError } = await supabase
      .from('triage_sessions')
      .insert({
        patient_id,
        symptoms,
        heart_rate,
        systolic_bp,
        diastolic_bp,
        temperature
      })
      .select()
      .single()

    if (triageError) throw triageError

    // 2️⃣ call AI service
    const aiRes = await fetch(process.env.AI_TRIAGE_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symptoms,
        heart_rate,
        systolic_bp,
        diastolic_bp,
        temperature
      })
    })

    const aiData = await aiRes.json()

    const { risk_score, department_id, explanation } = aiData

    // 3️⃣ store AI prediction
    await supabase.from('ai_predictions').insert({
      triage_id: triage.triage_id,
      risk_score,
      department_id,
      explanation
    })

    // 4️⃣ add to queue
    await supabase.from('patient_queue').insert({
      patient_id,
      triage_id: triage.triage_id,
      department_id,
      risk_score
    })

    return NextResponse.json({ success: true, risk_score, department_id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
