export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ✅ CHANGE: Use require instead of 'import pdf from...'
const pdf = require('pdf-parse')

export async function POST(req: NextRequest) {
  try {
    const { fileUrl, patientId } = await req.json()

    if (!fileUrl || !patientId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    // 1️⃣ Download file
    const res = await fetch(fileUrl)
    if (!res.ok) throw new Error('Failed to fetch PDF')
    
    // pdf-parse needs a Buffer
    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 2️⃣ Extract text
    // ✅ pdf is now the function directly
    const data = await pdf(buffer)
    const extractedText = data.text

    // 3️⃣ Save to DB
    const supabase = await createClient()
    const { error } = await supabase
      .from('patients')
      .update({ ehr_data: extractedText })
      .eq('patient_id', patientId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Extraction error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}