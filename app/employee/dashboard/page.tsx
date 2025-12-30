'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function EmployeeDashboard() {
  const router = useRouter()
  const [me, setMe] = useState<any>(null)
  const [currentPayslip, setCurrentPayslip] = useState<any>(null)
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [crewId, setCrewId] = useState<string>('')
  const [noEmployeeRecord, setNoEmployeeRecord] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (selectedMonth && crewId) {
      loadPayslip(selectedMonth)
    }
  }, [selectedMonth, crewId])

  async function load() {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user?.id) {
        setNoEmployeeRecord(true)
        setLoading(false)
        return
      }

      const { data: me, error: e1 } = await supabase
        .from('crews')
        .select('id, name')
        .eq('user_id', session.user.id)
        .single()

      if (e1 || !me) {
        setNoEmployeeRecord(true)
        setLoading(false)
        return
      }

      setMe(me)
      setCrewId(me.id)

      // Load distinct months from payslips (only my payslips)
      const { data: months } = await supabase
        .from('payslips')
        .select('month')
        .eq('crew_id', me.id)
        .order('month', { ascending: false })

      const monthList = [...new Set((months || []).map((p: any) => p.month))]
      setAvailableMonths(monthList)

      if (monthList.length > 0) {
        setSelectedMonth(monthList[0])
      }
    } catch (error) {
      console.error('Error loading employee data:', error)
      setNoEmployeeRecord(true)
    } finally {
      setLoading(false)
    }
  }

  async function loadPayslip(month: string) {
    const { data: ps } = await supabase
      .from('payslips')
      .select('*')
      .eq('crew_id', crewId)
      .eq('month', month)
      .single()

    setCurrentPayslip(ps)
  }

  function downloadPayslip() {
    if (me?.id && selectedMonth) {
      window.open(`/payslips/${me.id}/${selectedMonth}`)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: 18 }}>Loading...</div>
      </div>
    )
  }

  if (noEmployeeRecord) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          background: 'white',
          padding: 32,
          borderRadius: 16,
          textAlign: 'center'
        }}>
          <p>No employee record linked to this account</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: 800,
        margin: '0 auto'
      }}>
        {/* Welcome Header */}
        <div style={{
          marginBottom: 30,
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <h1 style={{
              fontSize: 32,
              fontWeight: 700,
              margin: '0 0 8px 0',
              color: 'white'
            }}>
              Welcome, {me?.name || 'Employee'}
            </h1>
            <p style={{
              fontSize: 16,
              margin: 0,
              opacity: 0.9
            }}>
              View and download your payslips
            </p>
          </div>
          <button
            onClick={logout}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
            }}
          >
            Logout
          </button>
        </div>

        {/* Payslip Card */}
        {currentPayslip ? (
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            marginBottom: 24
          }}>
            <h2 style={{
              fontSize: 20,
              fontWeight: 600,
              margin: '0 0 24px 0',
              color: '#1f2937'
            }}>
              This Month
            </h2>

            {/* Net Pay Display */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.9)',
                marginBottom: 8,
                fontWeight: 500
              }}>
                Net Pay
              </div>
              <div style={{
                fontSize: 42,
                fontWeight: 700,
                color: 'white',
                margin: 0
              }}>
                ${currentPayslip.net_pay?.toFixed(2) || '0.00'}
              </div>
            </div>

            {/* Month Selector and Download */}
            <div style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: '12px 16px',
                  fontSize: 14,
                  borderRadius: 8,
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  cursor: 'pointer',
                  fontWeight: 500,
                  flex: '1',
                  minWidth: 150
                }}
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <button
                onClick={downloadPayslip}
                style={{
                  padding: '12px 24px',
                  fontSize: 14,
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px rgba(37, 99, 235, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1d4ed8'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(37, 99, 235, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#2563eb'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(37, 99, 235, 0.3)'
                }}
              >
                Download Payslip PDF
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <p>No payslip available yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
