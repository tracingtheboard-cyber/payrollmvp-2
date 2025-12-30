'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useMonth } from '@/lib/useMonth'
import MonthSelector from '@/components/MonthSelector'

export default function SalaryPage() {
  const [month, setMonth] = useMonth()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [runStatus, setRunStatus] = useState('')
  const [hasPayslips, setHasPayslips] = useState<Set<string>>(new Set())

  useEffect(() => {
    load()
  }, [month])

  async function load() {
    setLoading(true)

    // 1. load crews
    const { data: crews } = await supabase
      .from('crews')
      .select('id,name,basic_salary')
      .order('name')

    // 2. load salary_items for this month
    const { data: items } = await supabase
      .from('salary_items')
      .select('*')
      .eq('month', month)

    // 3. check if payslips exist for this month
    const { data: payslips } = await supabase
      .from('payslip_detail_view')
      .select('crew_id')
      .eq('month', month)

    const payslipSet = new Set((payslips || []).map((p: any) => p.crew_id))
    setHasPayslips(payslipSet)

    const map: any = {}
    ;(items || []).forEach(i => {
      map[i.crew_id] = i
    })

    const merged = (crews || []).map(c => ({
      crew_id: c.id,
      name: c.name,
      basic: c.basic_salary,
      allowance: map[c.id]?.allowance || 0,
      overtime: map[c.id]?.overtime || 0,
      bonus: map[c.id]?.bonus || 0,
      leave: map[c.id]?.unutilised_leave_pay || 0,
      unpaid: map[c.id]?.unpaid_leave_deduction || 0,
      advance: map[c.id]?.advance_deduction || 0
    }))

    setRows(merged)
    setLoading(false)
  }

  function updateRow(index: number, field: string, value: string) {
    const copy = [...rows]
    copy[index][field] = Number(value)
    setRows(copy)
  }

  async function save() {
    const payload = rows.map(r => ({
      crew_id: r.crew_id,
      month,
      allowance: r.allowance,
      overtime: r.overtime,
      bonus: r.bonus,
      unutilised_leave_pay: r.leave,
      unpaid_leave_deduction: r.unpaid,
      advance_deduction: r.advance
    }))

    const { error } = await supabase
      .from('salary_items')
      .upsert(payload, { onConflict: 'crew_id,month' })

    if (error) {
      console.error(error)
      if (error.message.includes('row-level security')) {
        alert('权限错误：无法保存数据。请检查数据库 RLS 策略配置，确保 HR 用户有权限插入/更新 salary_items 表。')
      } else {
        alert('保存失败：' + error.message)
      }
    } else {
      alert('Saved')
      load()
    }
  }

  async function runPayroll() {
    setRunStatus('Running payroll...')
    const { error } = await supabase.rpc('run_payroll', { target_month: month })

    if (error) {
      console.error(error)
      setRunStatus(error.message)
    } else {
      setRunStatus('Payroll completed.')
      // Reload to check for payslips
      load()
    }
  }

  function viewPayslip(crewId: string) {
    window.open(`/payslips/${crewId}/${month}`, '_blank')
  }

  async function preview(crew_id: string) {
    const { data, error } = await supabase.rpc(
      'run_payroll_preview',
      {
        p_crew_id: crew_id,
        p_month: month
      }
    )

    if (error) {
      alert(error.message)
    } else {
      console.log(data)
      alert(
        `Gross: ${data[0].gross}
Employee CPF: ${data[0].employee_cpf}
Net Pay: ${data[0].net_pay}`
      )
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Salary Input</h1>
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
            <th>Basic</th>
            <th>Allowance</th>
            <th>OT</th>
            <th>Bonus</th>
            <th>Leave Pay</th>
            <th>Unpaid</th>
            <th>Advance</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.crew_id}>
              <td>{r.name}</td>
              <td>{r.basic}</td>
              <td><input value={r.allowance} onChange={e => updateRow(i,'allowance',e.target.value)} /></td>
              <td><input value={r.overtime} onChange={e => updateRow(i,'overtime',e.target.value)} /></td>
              <td><input value={r.bonus} onChange={e => updateRow(i,'bonus',e.target.value)} /></td>
              <td><input value={r.leave} onChange={e => updateRow(i,'leave',e.target.value)} /></td>
              <td><input value={r.unpaid} onChange={e => updateRow(i,'unpaid',e.target.value)} /></td>
              <td><input value={r.advance} onChange={e => updateRow(i,'advance',e.target.value)} /></td>
              <td>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button 
                    onClick={() => preview(r.crew_id)}
                    style={{
                      padding: '4px 8px',
                      fontSize: 12,
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    Preview
                  </button>
                  {hasPayslips.has(r.crew_id) && (
                    <button 
                      onClick={() => viewPayslip(r.crew_id)}
                      style={{
                        padding: '4px 8px',
                        fontSize: 12,
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      View Payslip
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
        <button onClick={runPayroll}>Run Payroll</button>
        <button onClick={save}>Save Month</button>
      </div>
      {runStatus && (
        <div style={{ 
          marginTop: 12, 
          textAlign: 'right',
          color: runStatus.includes('Error') || runStatus.includes('error') ? '#dc2626' : '#059669',
          fontSize: 14
        }}>
          {runStatus}
        </div>
      )}
    </div>
  )
}
