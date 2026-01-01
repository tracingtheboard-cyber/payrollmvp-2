'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useMonth } from '@/lib/useMonth'
import MonthSelector from '@/components/MonthSelector'

export default function PayslipsPage() {
  const [month, setMonth] = useMonth()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [month])

  async function load() {
    const { data, error } = await supabase
      .from('payslip_detail_view')
      .select('*')
      .eq('month', month)
      .order('name')

    if (error) {
      console.error(error)
      alert(error.message)
    } else {
      setRows(data || [])
    }

    setLoading(false)
  }

  function exportToCSV() {
    if (rows.length === 0) {
      alert('No data to export')
      return
    }

    // Define CSV headers
    const headers = [
      'Name',
      'Month',
      'Basic',
      'Allowance',
      'OT',
      'Bonus',
      'Leave',
      'Unpaid',
      'Advance',
      'Gross',
      'Employee CPF',
      'Employer CPF',
      'SDL',
      'Welfare',
      'Total Deduction',
      'Net Pay'
    ]

    // Convert rows to CSV format
    const csvRows = [
      headers.join(','),
      ...rows.map(r => [
        `"${r.name || ''}"`,
        `"${r.month || ''}"`,
        r.basic_salary || 0,
        r.allowance || 0,
        r.overtime || 0,
        r.bonus || 0,
        r.unutilised_leave_pay || 0,
        r.unpaid_leave_deduction || 0,
        r.advance_deduction || 0,
        r.gross || 0,
        r.employee_cpf || 0,
        r.employer_cpf || 0,
        r.sdl || 0,
        r.welfare || 0,
        r.total_deduction || 0,
        r.net_pay || 0
      ].join(','))
    ]

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `payslips_${month}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>report</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label>Month:</label>
          <MonthSelector value={month} onChange={setMonth} />
          <button onClick={exportToCSV} style={{ marginLeft: 10 }}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table border={1} cellPadding={4}>
        <thead>
          <tr>
            <th style={{ 
              backgroundColor: '#2563eb', 
              color: 'white', 
              fontWeight: 600, 
              padding: '10px 8px',
              textAlign: 'left',
              borderBottom: '2px solid #1e40af'
            }}>Name</th>
            <th style={{ 
              backgroundColor: '#2563eb', 
              color: 'white', 
              fontWeight: 600, 
              padding: '10px 8px',
              textAlign: 'left',
              borderBottom: '2px solid #1e40af'
            }}>Month</th>
            <th style={{ 
              backgroundColor: '#2563eb', 
              color: 'white', 
              fontWeight: 600, 
              padding: '10px 8px',
              textAlign: 'left',
              borderBottom: '2px solid #1e40af'
            }}>Basic</th>
            <th style={{ 
              backgroundColor: '#2563eb', 
              color: 'white', 
              fontWeight: 600, 
              padding: '10px 8px',
              textAlign: 'left',
              borderBottom: '2px solid #1e40af'
            }}>Allowance</th>
            <th style={{ 
              backgroundColor: '#2563eb', 
              color: 'white', 
              fontWeight: 600, 
              padding: '10px 8px',
              textAlign: 'left',
              borderBottom: '2px solid #1e40af'
            }}>OT</th>
            <th style={{ 
              backgroundColor: '#2563eb', 
              color: 'white', 
              fontWeight: 600, 
              padding: '10px 8px',
              textAlign: 'left',
              borderBottom: '2px solid #1e40af'
            }}>Bonus</th>
            <th style={{ 
              backgroundColor: '#2563eb', 
              color: 'white', 
              fontWeight: 600, 
              padding: '10px 8px',
              textAlign: 'left',
              borderBottom: '2px solid #1e40af'
            }}>Leave</th>
            <th style={{ 
              backgroundColor: '#2563eb', 
              color: 'white', 
              fontWeight: 600, 
              padding: '10px 8px',
              textAlign: 'left',
              borderBottom: '2px solid #1e40af'
            }}>Unpaid</th>
            <th style={{ 
              backgroundColor: '#2563eb', 
              color: 'white', 
              fontWeight: 600, 
              padding: '10px 8px',
              textAlign: 'left',
              borderBottom: '2px solid #1e40af'
            }}>Advance</th>
            <th style={{ 
              backgroundColor: '#2563eb', 
              color: 'white', 
              fontWeight: 600, 
              padding: '10px 8px',
              textAlign: 'left',
              borderBottom: '2px solid #1e40af'
            }}>Gross</th>
            <th style={{ 
              backgroundColor: '#2563eb', 
              color: 'white', 
              fontWeight: 600, 
              padding: '10px 8px',
              textAlign: 'left',
              borderBottom: '2px solid #1e40af'
            }}>Employee CPF</th>
            <th style={{ 
              backgroundColor: '#2563eb', 
              color: 'white', 
              fontWeight: 600, 
              padding: '10px 8px',
              textAlign: 'left',
              borderBottom: '2px solid #1e40af'
            }}>Employer CPF</th>
            <th style={{ 
              backgroundColor: '#2563eb', 
              color: 'white', 
              fontWeight: 600, 
              padding: '10px 8px',
              textAlign: 'left',
              borderBottom: '2px solid #1e40af'
            }}>SDL</th>
            <th style={{ 
              backgroundColor: '#2563eb', 
              color: 'white', 
              fontWeight: 600, 
              padding: '10px 8px',
              textAlign: 'left',
              borderBottom: '2px solid #1e40af'
            }}>Welfare</th>
            <th style={{ 
              backgroundColor: '#2563eb', 
              color: 'white', 
              fontWeight: 600, 
              padding: '10px 8px',
              textAlign: 'left',
              borderBottom: '2px solid #1e40af'
            }}>Total Deduction</th>
            <th style={{ 
              backgroundColor: '#2563eb', 
              color: 'white', 
              fontWeight: 600, 
              padding: '10px 8px',
              textAlign: 'left',
              borderBottom: '2px solid #1e40af'
            }}>Net Pay</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.name}</td>
              <td>{r.month}</td>
              <td>{r.basic_salary}</td>
              <td>{r.allowance}</td>
              <td>{r.overtime}</td>
              <td>{r.bonus}</td>
              <td>{r.unutilised_leave_pay}</td>
              <td>{r.unpaid_leave_deduction}</td>
              <td>{r.advance_deduction}</td>
              <td>{r.gross}</td>
              <td>{r.employee_cpf}</td>
              <td>{r.employer_cpf}</td>
              <td>{r.sdl}</td>
              <td>{r.welfare}</td>
              <td>{r.total_deduction}</td>
              <td>{r.net_pay}</td>
            </tr>
          ))}
          <tr style={{ fontWeight: 'bold', backgroundColor: '#f3f4f6' }}>
            <td>Total</td>
            <td></td>
            <td>{rows.reduce((sum, r) => sum + (r.basic_salary || 0), 0).toFixed(2)}</td>
            <td>{rows.reduce((sum, r) => sum + (r.allowance || 0), 0).toFixed(2)}</td>
            <td>{rows.reduce((sum, r) => sum + (r.overtime || 0), 0).toFixed(2)}</td>
            <td>{rows.reduce((sum, r) => sum + (r.bonus || 0), 0).toFixed(2)}</td>
            <td>{rows.reduce((sum, r) => sum + (r.unutilised_leave_pay || 0), 0).toFixed(2)}</td>
            <td>{rows.reduce((sum, r) => sum + (r.unpaid_leave_deduction || 0), 0).toFixed(2)}</td>
            <td>{rows.reduce((sum, r) => sum + (r.advance_deduction || 0), 0).toFixed(2)}</td>
            <td>{rows.reduce((sum, r) => sum + (r.gross || 0), 0).toFixed(2)}</td>
            <td>{rows.reduce((sum, r) => sum + (r.employee_cpf || 0), 0).toFixed(2)}</td>
            <td>{rows.reduce((sum, r) => sum + (r.employer_cpf || 0), 0).toFixed(2)}</td>
            <td>{rows.reduce((sum, r) => sum + (r.sdl || 0), 0).toFixed(2)}</td>
            <td>{rows.reduce((sum, r) => sum + (r.welfare || 0), 0).toFixed(2)}</td>
            <td>{rows.reduce((sum, r) => sum + (r.total_deduction || 0), 0).toFixed(2)}</td>
            <td>{rows.reduce((sum, r) => sum + (r.net_pay || 0), 0).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  )
}
