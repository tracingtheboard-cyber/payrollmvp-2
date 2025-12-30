'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function EmployeePayslipsPage() {
  const router = useRouter()
  const [me, setMe] = useState<any>(null)
  const [payslips, setPayslips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user?.id) {
        router.push('/login')
        return
      }

      const { data: me, error: e1 } = await supabase
        .from('crews')
        .select('id, name')
        .eq('user_id', session.user.id)
        .single()

      if (e1 || !me) {
        router.push('/login')
        return
      }

      setMe(me)

      // Load payslips for this employee
      const { data: payslipData } = await supabase
        .from('payslips')
        .select('*')
        .eq('crew_id', me.id)
        .order('month', { ascending: false })

      setPayslips(payslipData || [])
    } catch (error) {
      console.error('Error loading payslips:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  function viewPayslip(crewId: string, month: string) {
    window.open(`/payslips/${crewId}/${month}`, '_blank')
  }

  function downloadPayslip(crewId: string, month: string) {
    window.open(`/payslips/${crewId}/${month}`, '_blank')
  }

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>My Payslips</h1>
      
      {payslips.length === 0 ? (
        <div style={{
          background: 'white',
          padding: 32,
          borderRadius: 12,
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <p>No payslips available yet.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table border={1} cellPadding={4}>
            <thead>
              <tr>
                <th>Month</th>
                <th>Gross</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((p) => (
                <tr key={`${p.crew_id}-${p.month}`}>
                  <td>{p.month}</td>
                  <td>${p.gross?.toFixed(2) || '0.00'}</td>
                  <td>${p.total_deduction?.toFixed(2) || '0.00'}</td>
                  <td><strong>${p.net_pay?.toFixed(2) || '0.00'}</strong></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => viewPayslip(p.crew_id, p.month)}
                        style={{
                          padding: '6px 12px',
                          fontSize: 12,
                          background: '#2563eb',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer'
                        }}
                      >
                        View
                      </button>
                      <button
                        onClick={() => downloadPayslip(p.crew_id, p.month)}
                        style={{
                          padding: '6px 12px',
                          fontSize: 12,
                          background: '#059669',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer'
                        }}
                      >
                        Download PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

