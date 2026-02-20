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
      temperature,
      pre_existing_conditions
    } = body

    // 1️⃣ Store triage session
    const { data: triage, error: triageError } = await supabase
      .from('triage_sessions')
      .insert({
        patient_id,
        symptoms,
        heart_rate,
        systolic_bp,
        diastolic_bp,
        temperature,
        pre_existing_conditions
      })
      .select()
      .single()

    if (triageError) {
      console.error("Supabase Triage Error:", triageError)
      throw new Error(`Database error: ${triageError.message}`)
    }

    console.log("Triage session stored with ID:", triage)

    // 2️⃣ Call AI service (with safety check)
    if (!process.env.AI_TRIAGE_URL) {
      throw new Error("AI_TRIAGE_URL is not defined in environment variables.")
    }

    const aiRes = await fetch(process.env.AI_TRIAGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symptoms,
        heart_rate,
        systolic_bp,
        diastolic_bp,
        temperature,
        pre_existing_conditions,
        patient_id : patient_id || "unknown" // Fallback for missing patient_id
      })
    })

    if (!aiRes.ok) {
      const errorText = await aiRes.text()
      throw new Error(`AI Service failed (${aiRes.status}): ${errorText}`)
    }


    const aiData = await aiRes.json()

    console.log("AI service returned this JSON:", aiData)
    const { risk_level, department_id, explainability,shap_values } = aiData
    console.log("AI Response:", aiData, "for triage ID:", triage.triage_id)


    const triage_id = triage.triage_id
    
    // 3️⃣ Store AI prediction
    const { error: aiStoreError } = await supabase.from('ai_predictions').insert({
      triage_id: triage.triage_id,
      risk_level: risk_level / 100,
      recommended_department_id: department_id,
      explainability,
      shap_values 
    })
    
    if (aiStoreError) console.error("AI Storage Error:", aiStoreError)

    // // 4️⃣ Add to queue
    // const { error: queueError } = await supabase.from('patient_queue').insert({
    //   patient_id,
    //   triage_id: triage.triage_id,
    //   department_id,
    //   risk_score
    // })

    // if (queueError) console.error("Queue Storage Error:", queueError)

    return NextResponse.json({ 
      success: true, 
      risk_score: risk_level, 
      department_id, 
      explainability, 
    })

  } catch (err: any) {
    console.error("Critical Triage Route Error:", err.message)
    return NextResponse.json(
      { error: err.message || "Internal Server Error" }, 
      { status: 500 }
    )
  }
}