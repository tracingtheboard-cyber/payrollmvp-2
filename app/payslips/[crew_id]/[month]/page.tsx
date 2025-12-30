'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import html2pdf from 'html2pdf.js'

export default function PayslipPrintPage() {
  const { crew_id, month } = useParams() as { crew_id: string; month: string }
  const router = useRouter()
  const [d, setD] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        router.push('/login')
        return
      }

      // Check if user is an employee - verify they can only view their own payslip
      const { data: crew } = await supabase
        .from('crews')
        .select('id, user_id')
        .eq('user_id', session.user.id)
        .single()

      // If user is an employee, they can only view their own payslip
      if (crew && crew.id !== crew_id) {
        setUnauthorized(true)
        setLoading(false)
        return
      }

      // Load payslip data
      const { data, error } = await supabase
        .from('payslip_detail_view')
        .select('*')
        .eq('crew_id', crew_id)
        .eq('month', month)
        .single()

      if (error) {
        alert(error.message)
        setLoading(false)
        return
      }

      setD(data)
    } catch (error) {
      console.error('Error loading payslip:', error)
      setUnauthorized(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>Unauthorized Access</h2>
        <p>You can only view your own payslips.</p>
        <button
          onClick={() => router.push('/employee/dashboard')}
          style={{
            padding: '10px 20px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            marginTop: 20
          }}
        >
          Go to Dashboard
        </button>
      </div>
    )
  }

  if (!d) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p>Payslip not found.</p>
      </div>
    )
  }

  function downloadPDF() {
    const element = document.getElementById('payslip')
    const buttonContainer = document.querySelector('.no-print') as HTMLElement
    if (element) {
      // Hide buttons before generating PDF
      if (buttonContainer) {
        buttonContainer.style.display = 'none'
      }
      
      html2pdf().from(element).save(`Payslip-${d.name}-${d.month}.pdf`).then(() => {
        // Show buttons again after PDF is generated
        if (buttonContainer) {
          buttonContainer.style.display = 'block'
        }
      })
    }
  }

  return (
    <div id="payslip" style={{
      width: '210mm',
      minHeight: '297mm',
      margin: 'auto',
      padding: '20mm',
      fontFamily: 'Arial',
      fontSize: '12px',
      background: '#fff',
      color: '#000'
    }}>

      {/* Header */}
      <h2 style={{ marginBottom: 5 }}>CACTUS GROUP (PTE. LTD.)</h2>
      <div style={{ marginBottom: 20 }}>
        Payslip for {d.month}
      </div>

      {/* Employee Info */}
      <table width="100%" border={1} cellPadding={6}>
        <tbody>
          <tr><td width="30%">Name</td><td>{d.name}</td></tr>
          <tr><td>NRIC</td><td>{d.nric}</td></tr>
        </tbody>
      </table>

      {/* Earnings */}
      <h3 style={{ marginTop: 20 }}>Earnings</h3>
      <table width="100%" border={1} cellPadding={6}>
        <tbody>
          <tr><td>Basic Salary</td><td align="right">{d.basic_salary}</td></tr>
          <tr><td>Allowance</td><td align="right">{d.allowance}</td></tr>
          <tr><td>Overtime</td><td align="right">{d.overtime}</td></tr>
          <tr><td>Bonus</td><td align="right">{d.bonus}</td></tr>
          <tr><td>Unutilised Leave</td><td align="right">{d.unutilised_leave_pay}</td></tr>
          <tr><td>Unpaid Leave</td><td align="right">-{d.unpaid_leave_deduction}</td></tr>
        </tbody>
      </table>

      {/* Deductions */}
      <h3 style={{ marginTop: 20 }}>Deductions</h3>
      <table width="100%" border={1} cellPadding={6}>
        <tbody>
          <tr><td>Employee CPF</td><td align="right">{d.employee_cpf}</td></tr>
          <tr><td>SDL</td><td align="right">{d.sdl}</td></tr>
          <tr><td>Welfare</td><td align="right">{d.welfare}</td></tr>
          <tr><td>Advance</td><td align="right">{d.advance_deduction}</td></tr>
        </tbody>
      </table>

      {/* Totals */}
      <table width="100%" border={1} cellPadding={8} style={{ marginTop: 20 }}>
        <tbody>
          <tr><td><strong>Gross Salary</strong></td><td align="right">{d.gross}</td></tr>
          <tr><td><strong>Total Deduction</strong></td><td align="right">{d.total_deduction}</td></tr>
          <tr>
            <td><strong>Net Pay</strong></td>
            <td align="right"><strong>{d.net_pay}</strong></td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ marginTop: 40, fontSize: 10 }}>
        This is a computer generated payslip. No signature is required.
      </div>

      <div className="no-print" style={{ marginTop: 20, textAlign: 'right' }}>
        <button onClick={downloadPDF}>Download PDF</button>
        <button onClick={() => window.print()} style={{ marginLeft: 10 }}>
          Print
        </button>
      </div>

    </div>
  )
}
