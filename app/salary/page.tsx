'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useMonth } from '@/lib/useMonth'

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
      .select('id,name')
      .order('name')

    // 2. load crew_compensation (active records)
    const { data: compensations } = await supabase
      .from('crew_compensation')
      .select('crew_id,basic_salary')
      .eq('is_active', true)

    // 3. load salary_items for this month
    const { data: items } = await supabase
      .from('salary_items')
      .select('*')
      .eq('month', month)

    // 4. check if payslips exist for this month
    const { data: payslips } = await supabase
      .from('payslip_detail_view')
      .select('crew_id')
      .eq('month', month)

    const payslipSet = new Set((payslips || []).map((p: any) => p.crew_id))
    setHasPayslips(payslipSet)

    const compensationMap: any = {}
    ;(compensations || []).forEach(cc => {
      compensationMap[cc.crew_id] = cc
    })

    const itemMap: any = {}
    ;(items || []).forEach(i => {
      itemMap[i.crew_id] = i
    })

    const merged = (crews || []).map(c => {
      const compensation = compensationMap[c.id]
      const item = itemMap[c.id]
      // 合并 leave pay (正数) 和 unpaid deduction (负数)
      // 如果 unutilised_leave_pay > 0，显示正数；如果 unpaid_leave_deduction > 0，显示负数
      const leaveAdjustment = (item?.unutilised_leave_pay || 0) - (item?.unpaid_leave_deduction || 0)
      
      return {
        crew_id: c.id,
        name: c.name,
        basic: compensation?.basic_salary || 0,
        allowance: item?.allowance || 0,
        overtime: item?.overtime || 0,
        bonus: item?.bonus || 0,
        leave_adjustment: leaveAdjustment,
        advance: item?.advance_deduction || 0,
        adjustment: item?.adjustment || 0
      }
    })

    setRows(merged)
    setLoading(false)
  }

  function updateRow(index: number, field: string, value: string) {
    const copy = [...rows]
    // 允许负数，空字符串处理为0
    const numValue = value === '' ? 0 : Number(value)
    copy[index][field] = isNaN(numValue) ? 0 : numValue
    setRows(copy)
  }

  async function save() {
    const payload = rows.map(r => {
      // 根据 leave_adjustment 的值，拆分到两个字段
      // 正数存到 unutilised_leave_pay，负数（取绝对值）存到 unpaid_leave_deduction
      const leaveAdjustment = r.leave_adjustment || 0
      const unutilised_leave_pay = leaveAdjustment > 0 ? leaveAdjustment : 0
      const unpaid_leave_deduction = leaveAdjustment < 0 ? Math.abs(leaveAdjustment) : 0
      
      return {
        crew_id: r.crew_id,
        month,
        allowance: r.allowance || 0,
        overtime: r.overtime || 0,
        bonus: r.bonus || 0,
        unutilised_leave_pay,
        unpaid_leave_deduction,
        advance_deduction: r.advance || 0,
        adjustment: r.adjustment || 0
      }
    })

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

  // Generate 2026 year months
  const months2026 = Array.from({ length: 12 }, (_, i) => {
    const monthNum = String(i + 1).padStart(2, '0')
    return `2026-${monthNum}`
  })

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Salary Input</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label>Month:</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{
              padding: '8px 12px',
              fontSize: 14,
              borderRadius: 6,
              border: '1px solid #ddd',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            {months2026.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-wrapper" style={{ marginLeft: 0, marginRight: 'auto' }}>
        <table border={0} cellPadding={0} cellSpacing={0} style={{ fontSize: '13px', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr>
            <th style={{ padding: '3px 4px', textAlign: 'left' }}>Name</th>
            <th style={{ padding: '3px 4px', textAlign: 'left' }}>Basic</th>
            <th style={{ padding: '3px 4px', textAlign: 'left' }}>Allowance</th>
            <th style={{ padding: '3px 4px', textAlign: 'left' }}>OT</th>
            <th style={{ padding: '3px 4px', textAlign: 'left' }}>Bonus</th>
            <th style={{ padding: '3px 4px', textAlign: 'left' }}>Leave Pay/Unpaid Leave</th>
            <th style={{ padding: '3px 4px', textAlign: 'left' }}>Advance</th>
            <th style={{ padding: '3px 4px', textAlign: 'left' }}>Adjustment</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.crew_id}>
              <td style={{ padding: '2px 4px', textAlign: 'left' }}>{r.name}</td>
              <td style={{ padding: '2px 4px', textAlign: 'left' }}>{r.basic}</td>
              <td style={{ padding: '2px 4px', textAlign: 'left' }}><input type="number" step="any" value={r.allowance || ''} onChange={e => updateRow(i,'allowance',e.target.value)} style={{ width: '66.67%', padding: '2px 3px', fontSize: '13px', textAlign: 'left' }} /></td>
              <td style={{ padding: '2px 4px', textAlign: 'left' }}><input type="number" step="any" value={r.overtime || ''} onChange={e => updateRow(i,'overtime',e.target.value)} style={{ width: '66.67%', padding: '2px 3px', fontSize: '13px', textAlign: 'left' }} /></td>
              <td style={{ padding: '2px 4px', textAlign: 'left' }}><input type="number" step="any" value={r.bonus || ''} onChange={e => updateRow(i,'bonus',e.target.value)} style={{ width: '66.67%', padding: '2px 3px', fontSize: '13px', textAlign: 'left' }} /></td>
              <td style={{ padding: '2px 4px', textAlign: 'left' }}><input type="number" step="any" value={r.leave_adjustment || ''} onChange={e => updateRow(i,'leave_adjustment',e.target.value)} style={{ width: '66.67%', padding: '2px 3px', fontSize: '13px', textAlign: 'left' }} /></td>
              <td style={{ padding: '2px 4px', textAlign: 'left' }}><input type="number" step="any" value={r.advance || ''} onChange={e => updateRow(i,'advance',e.target.value)} style={{ width: '66.67%', padding: '2px 3px', fontSize: '13px', textAlign: 'left' }} /></td>
              <td style={{ padding: '2px 4px', textAlign: 'left' }}><input type="number" step="any" value={r.adjustment || ''} onChange={e => updateRow(i,'adjustment',e.target.value)} style={{ width: '66.67%', padding: '2px 3px', fontSize: '13px', textAlign: 'left' }} /></td>
            </tr>
          ))}
          <tr style={{ fontWeight: 'bold', backgroundColor: '#f3f4f6' }}>
            <td style={{ padding: '2px 4px', textAlign: 'left' }}>Total</td>
            <td style={{ padding: '2px 4px', textAlign: 'left' }}>{rows.reduce((sum, r) => sum + (r.basic || 0), 0).toFixed(2)}</td>
            <td style={{ padding: '2px 4px', textAlign: 'left' }}>{rows.reduce((sum, r) => sum + (r.allowance || 0), 0).toFixed(2)}</td>
            <td style={{ padding: '2px 4px', textAlign: 'left' }}>{rows.reduce((sum, r) => sum + (r.overtime || 0), 0).toFixed(2)}</td>
            <td style={{ padding: '2px 4px', textAlign: 'left' }}>{rows.reduce((sum, r) => sum + (r.bonus || 0), 0).toFixed(2)}</td>
            <td style={{ padding: '2px 4px', textAlign: 'left' }}>{rows.reduce((sum, r) => sum + (r.leave_adjustment || 0), 0).toFixed(2)}</td>
            <td style={{ padding: '2px 4px', textAlign: 'left' }}>{rows.reduce((sum, r) => sum + (r.advance || 0), 0).toFixed(2)}</td>
            <td style={{ padding: '2px 4px', textAlign: 'left' }}>{rows.reduce((sum, r) => sum + (r.adjustment || 0), 0).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
        <button onClick={runPayroll}>Calculate</button>
        <button onClick={runPayroll}>Close Month</button>
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
