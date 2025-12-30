'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function HrLeavePage() {
  const router = useRouter()
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    load()
  }, [filterStatus, filterType])

  async function load() {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user?.id) {
        router.push('/login')
        return
      }

      // Load all leave requests (HR can see all)
      // Build query step by step
      let queryBuilder: any = supabase
        .from('leaves')
        .select('*')

      // Apply filters
      if (filterStatus !== 'all') {
        queryBuilder = queryBuilder.eq('status', filterStatus)
      }

      if (filterType !== 'all') {
        queryBuilder = queryBuilder.eq('type', filterType)
      }

      // Add ordering
      queryBuilder = queryBuilder.order('leave_date', { ascending: false })

      const { data: leavesData, error: leavesError } = await queryBuilder

      if (leavesError) {
        console.error('Error loading leave requests:', leavesError)
        alert('Error loading leave requests: ' + leavesError.message)
        setLeaveRequests([])
        return
      }

      console.log('Loaded leaves:', leavesData) // Debug log

      // Load crew information for each leave request
      const crewIds = [...new Set((leavesData || []).map((l: any) => l.crew_id).filter(Boolean))]
      
      console.log('Crew IDs:', crewIds) // Debug log
      
      let crewsMap: any = {}
      if (crewIds.length > 0) {
        const { data: crewsData, error: crewsError } = await supabase
          .from('crews')
          .select('id, name, nric')
          .in('id', crewIds)

        if (crewsError) {
          console.error('Error loading crews:', crewsError)
        } else {
          console.log('Loaded crews:', crewsData) // Debug log
          if (crewsData) {
            crewsData.forEach((c: any) => {
              crewsMap[c.id] = c
            })
          }
        }
      }

      // Merge leave requests with crew information
      const mergedData = (leavesData || []).map((leave: any) => ({
        ...leave,
        crews: leave.crew_id ? crewsMap[leave.crew_id] : null
      }))

      console.log('Merged data:', mergedData) // Debug log
      setLeaveRequests(mergedData)
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Error: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function updateLeaveStatus(leaveId: string, newStatus: 'approved' | 'rejected') {
    const { error } = await supabase
      .from('leaves')
      .update({ status: newStatus })
      .eq('id', leaveId)

    if (error) {
      console.error('Error updating leave status:', error)
      alert('Error updating leave status: ' + error.message)
    } else {
      alert(`Leave request ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully`)
      load() // Reload to show updated status
    }
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
      <h1>Leave Management</h1>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginBottom: 24,
        background: 'white',
        padding: 16,
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
            Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '8px 12px',
              fontSize: 14,
              border: '2px solid #e5e7eb',
              borderRadius: 8,
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
            Leave Type
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '8px 12px',
              fontSize: 14,
              border: '2px solid #e5e7eb',
              borderRadius: 8,
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="all">All</option>
            <option value="annual">Annual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="unpaid">Unpaid Leave</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div style={{
        background: 'white',
        padding: 24,
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: 20 }}>Leave Requests</h2>
        
        {leaveRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
            <p>No leave requests found.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table border={1} cellPadding={4}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Leave Date</th>
                  <th>Days</th>
                  <th>Remark</th>
                  <th>Evidence</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      {req.crews ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{req.crews.name}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{req.crews.nric}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>Unknown</span>
                      )}
                    </td>
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
                    <td>
                      {req.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => updateLeaveStatus(req.id, 'approved')}
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
                            Approve
                          </button>
                          <button
                            onClick={() => updateLeaveStatus(req.id, 'rejected')}
                            style={{
                              padding: '6px 12px',
                              fontSize: 12,
                              background: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer'
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {req.status !== 'pending' && (
                        <span style={{ color: '#9ca3af', fontSize: 12 }}>
                          {req.status === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      )}
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

