'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function EmployeeLeavePage() {
  const router = useRouter()
  const [me, setMe] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [leaveBalance, setLeaveBalance] = useState<any>({
    annual: { total: 14, used: 0, balance: 14 },
    sick: { total: 14, used: 0, balance: 14 },
    unpaid: { total: 0, used: 0, balance: 0 },
    other: { total: 0, used: 0, balance: 0 }
  })
  const [showForm, setShowForm] = useState(false)
  
  // Form fields
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [days, setDays] = useState('1')
  const [leaveType, setLeaveType] = useState('annual')
  const [remark, setRemark] = useState('')
  const [evidence, setEvidence] = useState<File | null>(null)
  const [evidenceUrl, setEvidenceUrl] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

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

      // Load leave requests for this employee
      const { data: requests } = await supabase
        .from('leaves')
        .select('*')
        .eq('crew_id', me.id)
        .order('leave_date', { ascending: false })

      setLeaveRequests(requests || [])

      // Calculate leave balance
      calculateLeaveBalance(requests || [])
    } catch (error) {
      console.error('Error loading data:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  // Calculate leave balance from approved leaves
  function calculateLeaveBalance(requests: any[]) {
    const currentYear = new Date().getFullYear()
    
    // Default entitlements (can be customized or loaded from database)
    const entitlements: any = {
      annual: 14,  // Annual leave entitlement
      sick: 14,    // Sick leave entitlement
      unpaid: 0,   // Unpaid leave has no limit
      other: 0     // Other leave has no limit
    }

    // Calculate used days for each type (only approved leaves in current year)
    const used: any = {
      annual: 0,
      sick: 0,
      unpaid: 0,
      other: 0
    }

    requests.forEach((req) => {
      if (req.status === 'approved') {
        const leaveYear = new Date(req.leave_date).getFullYear()
        if (leaveYear === currentYear) {
          const type = req.type || 'other'
          if (used[type] !== undefined) {
            used[type] += Number(req.days) || 0
          }
        }
      }
    })

    // Calculate balance
    const balance: any = {
      annual: { 
        total: entitlements.annual, 
        used: used.annual, 
        balance: entitlements.annual - used.annual 
      },
      sick: { 
        total: entitlements.sick, 
        used: used.sick, 
        balance: entitlements.sick - used.sick 
      },
      unpaid: { 
        total: 0, 
        used: used.unpaid, 
        balance: 0 
      },
      other: { 
        total: 0, 
        used: used.other, 
        balance: 0 
      }
    }

    setLeaveBalance(balance)
  }

  // Calculate days based on start and end date
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (start <= end) {
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        setDays(diffDays.toString())
      } else {
        setDays('1')
      }
    }
  }, [startDate, endDate])

  async function submitLeaveRequest() {
    if (!startDate || !endDate) {
      alert('Please fill in start date and end date')
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('End date must be after or equal to start date')
      return
    }

    const calculatedDays = Number(days)
    if (calculatedDays <= 0) {
      alert('Invalid date range')
      return
    }

    setSubmitting(true)
    
    let evidencePath = null
    
    // Upload evidence file if provided
    if (evidence) {
      const fileExt = evidence.name.split('.').pop()
      const fileName = `${me?.id || 'unknown'}_${Date.now()}.${fileExt}`
      const filePath = `leave-evidence/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('HRMSMVP')
        .upload(filePath, evidence)
      
      if (uploadError) {
        console.error('Error uploading evidence:', uploadError)
        alert('Error uploading evidence: ' + uploadError.message)
        setSubmitting(false)
        return
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('HRMSMVP')
        .getPublicUrl(filePath)
      
      evidencePath = urlData.publicUrl
    }

    const insertData: any = {
      leave_date: startDate, // Use start_date as leave_date
      days: calculatedDays,
      type: leaveType,
      status: 'pending'
    }

    // Add crew_id if available
    if (me?.id) {
      insertData.crew_id = me.id
    }

    // Add evidence_url if available
    if (evidencePath) {
      insertData.evidence_url = evidencePath
    }

    // Add remark if provided
    if (remark.trim()) {
      insertData.remark = remark.trim()
    }

    const { error } = await supabase
      .from('leaves')
      .insert(insertData)

    if (error) {
      console.error(error)
      alert('Error submitting leave request: ' + error.message)
    } else {
      alert('Leave request submitted successfully')
      setShowForm(false)
      setStartDate('')
      setEndDate('')
      setDays('1')
      setLeaveType('annual')
      setRemark('')
      setEvidence(null)
      setEvidenceUrl('')
      if (evidenceUrl) {
        URL.revokeObjectURL(evidenceUrl)
      }
      load() // Reload to show new request
    }
    setSubmitting(false)
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'approved': return '#059669'
      case 'rejected': return '#dc2626'
      case 'pending': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'approved': return 'Approved'
      case 'rejected': return 'Rejected'
      case 'pending': return 'Pending'
      default: return status
    }
  }

  function getLeaveTypeLabel(type: string) {
    switch (type) {
      case 'annual': return 'Annual Leave'
      case 'sick': return 'Sick Leave'
      case 'unpaid': return 'Unpaid Leave'
      case 'other': return 'Other'
      default: return type || 'N/A'
    }
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Leave Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            background: showForm ? '#6b7280' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          {showForm ? 'Cancel' : 'Apply for Leave'}
        </button>
      </div>

      {/* Leave Balance Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        <div style={{
          background: 'white',
          padding: 20,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #2563eb'
        }}>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>
            Annual Leave
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
            {leaveBalance.annual.balance}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            {leaveBalance.annual.used} / {leaveBalance.annual.total} used
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: 20,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #059669'
        }}>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>
            Sick Leave
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
            {leaveBalance.sick.balance}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            {leaveBalance.sick.used} / {leaveBalance.sick.total} used
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: 20,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #f59e0b'
        }}>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>
            Unpaid Leave
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
            {leaveBalance.unpaid.used}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            Days taken this year
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: 20,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #8b5cf6'
        }}>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8, fontWeight: 500 }}>
            Other Leave
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
            {leaveBalance.other.used}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            Days taken this year
          </div>
        </div>
      </div>

      {/* Leave Application Form */}
      {showForm && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 24
        }}>
          <div style={{
            background: 'white',
            padding: 24,
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            width: '100%',
            maxWidth: 600
          }}>
          <h2 style={{ marginTop: 0, marginBottom: 20 }}>New Leave Request</h2>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
              Leave Type *
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                border: '2px solid #e5e7eb',
                borderRadius: 8,
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="unpaid">Unpaid Leave</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: 14,
                  border: '2px solid #e5e7eb',
                  borderRadius: 8,
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: 14,
                  border: '2px solid #e5e7eb',
                  borderRadius: 8,
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {startDate && endDate && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f3f4f6', borderRadius: 8 }}>
              <span style={{ fontSize: 14, color: '#6b7280' }}>
                Total Days: <strong>{days}</strong> {Number(days) === 1 ? 'day' : 'days'}
              </span>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
              Remark (Optional)
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Add any additional remarks or notes"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                border: '2px solid #e5e7eb',
                borderRadius: 8,
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
              Evidence (Optional)
            </label>
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setEvidence(file)
                  // Create preview URL for images
                  if (file.type.startsWith('image/')) {
                    setEvidenceUrl(URL.createObjectURL(file))
                  } else {
                    setEvidenceUrl('')
                  }
                }
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                border: '2px solid #e5e7eb',
                borderRadius: 8,
                background: 'white',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            />
            {evidence && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                Selected: {evidence.name} ({(evidence.size / 1024).toFixed(2)} KB)
              </div>
            )}
            {evidenceUrl && (
              <div style={{ marginTop: 12 }}>
                <img
                  src={evidenceUrl}
                  alt="Evidence preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 200,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb'
                  }}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '10px 20px',
                background: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500
              }}
            >
              Cancel
            </button>
            <button
              onClick={submitLeaveRequest}
              disabled={submitting}
              style={{
                padding: '10px 20px',
                background: submitting ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 500
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
          </div>
        </div>
      )}

      {/* Leave Requests List */}
      <div style={{
        background: 'white',
        padding: 24,
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: 20 }}>My Leave Requests</h2>
        
        {leaveRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
            <p>No leave requests yet.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table border={1} cellPadding={4}>
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Leave Date</th>
                  <th>Days</th>
                  <th>Remark</th>
                  <th>Evidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((req) => (
                  <tr key={req.id}>
                    <td>{getLeaveTypeLabel(req.type)}</td>
                    <td>{req.leave_date}</td>
                    <td>{req.days}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {req.remark || <span style={{ color: '#9ca3af', fontSize: 12 }}>No remark</span>}
                    </td>
                    <td>
                      {req.evidence_url ? (
                        <a
                          href={req.evidence_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontSize: 12
                          }}
                        >
                          View Evidence
                        </a>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: 12 }}>No evidence</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                        background: getStatusColor(req.status) + '20',
                        color: getStatusColor(req.status)
                      }}>
                        {getStatusLabel(req.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
