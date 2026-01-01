'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useMonth } from '@/lib/useMonth'
import MonthSelector from '@/components/MonthSelector'

export default function RunPage() {
  const [month, setMonth] = useMonth()
  const [status, setStatus] = useState('')
  const [employeeName, setEmployeeName] = useState('')
  const [payslips, setPayslips] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

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

  async function searchPayslips() {
    if (!employeeName.trim()) {
      alert('Please enter employee name')
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('payslip_detail_view')
      .select('*')
      .ilike('name', `%${employeeName}%`)
      .order('month', { ascending: false })

    if (error) {
      console.error(error)
      alert('Error: ' + error.message)
    } else {
      setPayslips(data || [])
    }
    setLoading(false)
  }

  function downloadPayslip(crewId: string, month: string) {
    window.open(`/payslips/${crewId}/${month}`, '_blank')
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
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
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
          Calculate
        </button>
      </div>
      <p style={{ marginBottom: 20 }}>Click the button below to run the payroll calculation for <strong>{month}</strong>.</p>
      <div style={{ display: 'flex', gap: 10 }}>
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
          Close Month
        </button>
      </div>
      <div style={{ height: '4px', backgroundColor: '#e5e7eb', marginTop: 20, marginBottom: 20 }}></div>
      
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ marginBottom: 15, fontSize: 18, fontWeight: 600 }}>Search Payslips</h2>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Enter employee name"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchPayslips()}
            style={{
              padding: '8px 12px',
              fontSize: 14,
              border: '1px solid #ddd',
              borderRadius: 6,
              flex: 1,
              maxWidth: 300
            }}
          />
          <button
            onClick={searchPayslips}
            disabled={loading}
            style={{
              padding: '8px 20px',
              fontSize: 14,
              background: loading ? '#94a3b8' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {payslips.length > 0 && (
          <div>
            <table border={1} cellPadding={4} cellSpacing={0} style={{ fontSize: '13px', width: '100%', maxWidth: 800 }}>
              <thead>
                <tr>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Month</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Net Pay</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((p) => (
                  <tr key={`${p.crew_id}-${p.month}`}>
                    <td style={{ padding: '6px 8px' }}>{p.name}</td>
                    <td style={{ padding: '6px 8px' }}>{p.month}</td>
                    <td style={{ padding: '6px 8px' }}>${p.net_pay?.toFixed(2) || '0.00'}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <button
                        onClick={() => downloadPayslip(p.crew_id, p.month)}
                        style={{
                          padding: '4px 12px',
                          fontSize: 12,
                          background: '#059669',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer'
                        }}
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {payslips.length === 0 && employeeName && !loading && (
          <p style={{ color: '#64748b' }}>No payslips found.</p>
        )}
      </div>

      {status && (
        <p style={{ marginTop: 16, color: status.includes('Error') || status.includes('error') ? '#dc2626' : '#059669' }}>
          {status}
        </p>
      )}
    </div>
  )
}

