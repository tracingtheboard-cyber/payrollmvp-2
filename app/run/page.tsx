'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useMonth } from '@/lib/useMonth'
import MonthSelector from '@/components/MonthSelector'

export default function RunPage() {
  const [month, setMonth] = useMonth()
  const [status, setStatus] = useState('')

  async function runPayroll() {
    setStatus('Running payroll...')
    const { error } = await supabase.rpc('run_payroll', { target_month: month })

    if (error) {
      console.error(error)
      setStatus(error.message)
    } else {
      setStatus('Payroll completed.')
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Run Payroll</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label>Month:</label>
          <MonthSelector value={month} onChange={setMonth} />
        </div>
      </div>
      <p>Click the button below to run the payroll calculation for <strong>{month}</strong>.</p>
      <button 
        onClick={runPayroll}
        style={{ 
          padding: '12px 24px', 
          fontSize: 16, 
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer'
        }}
      >
        Run Payroll
      </button>
      {status && (
        <p style={{ marginTop: 16, color: status.includes('Error') || status.includes('error') ? '#dc2626' : '#059669' }}>
          {status}
        </p>
      )}
    </div>
  )
}

