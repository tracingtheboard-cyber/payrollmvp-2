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

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Payslips</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label>Month:</label>
          <MonthSelector value={month} onChange={setMonth} />
        </div>
      </div>

      <div className="table-wrapper">
        <table border={1} cellPadding={4}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Month</th>
            <th>Basic</th>
            <th>Allowance</th>
            <th>OT</th>
            <th>Bonus</th>
            <th>Leave</th>
            <th>Unpaid</th>
            <th>Advance</th>
            <th>Gross</th>
            <th>Employee CPF</th>
            <th>Employer CPF</th>
            <th>SDL</th>
            <th>Welfare</th>
            <th>Total Deduction</th>
            <th>Net Pay</th>
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
        </tbody>
      </table>
      </div>
    </div>
  )
}
