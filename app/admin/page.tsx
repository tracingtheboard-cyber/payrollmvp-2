'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showUserForm, setShowUserForm] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [editingCrewId, setEditingCrewId] = useState<string | null>(null)
  
  // User creation form fields
  const [userEmail, setUserEmail] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const [userRole, setUserRole] = useState<'hr' | 'employee'>('employee')
  const [userName, setUserName] = useState('')
  const [userNric, setUserNric] = useState('')
  const [userBasicSalary, setUserBasicSalary] = useState('')
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadStats()
    loadUsers()
  }, [])

  async function loadStats() {
    try {
      // Load various statistics
      const [crewsResult, payslipsResult, salaryItemsResult] = await Promise.all([
        supabase.from('crews').select('id', { count: 'exact', head: true }),
        supabase.from('payslips').select('id', { count: 'exact', head: true }),
        supabase.from('salary_items').select('id', { count: 'exact', head: true })
      ])

      setStats({
        totalCrews: crewsResult.count || 0,
        totalPayslips: payslipsResult.count || 0,
        totalSalaryItems: salaryItemsResult.count || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadUsers() {
    try {
      // Load all crews (employees)
      const { data: crews } = await supabase
        .from('crews')
        .select('id, name, nric, user_id')
        .order('name')

      // Load active crew_compensation records
      const { data: compensations } = await supabase
        .from('crew_compensation')
        .select('crew_id, basic_salary')
        .eq('is_active', true)

      // Merge crews with compensation data
      const compensationMap: any = {}
      ;(compensations || []).forEach(cc => {
        compensationMap[cc.crew_id] = cc
      })

      const usersWithSalary = (crews || []).map(c => ({
        ...c,
        basic_salary: compensationMap[c.id]?.basic_salary || null
      }))

      // Note: We can't directly query auth.users from frontend
      // This is a simplified view showing crews with user_id
      setUsers(usersWithSalary)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  function resetForm() {
    setUserEmail('')
    setUserPassword('')
    setUserRole('employee')
    setUserName('')
    setUserNric('')
    setUserBasicSalary('')
    setEditingCrewId(null)
  }

  async function loadEmployeeForEdit(crewId: string) {
    try {
      // Load crew data
      const { data: crewData } = await supabase
        .from('crews')
        .select('*')
        .eq('id', crewId)
        .single()

      // Load active compensation
      const { data: compensationData } = await supabase
        .from('crew_compensation')
        .select('basic_salary')
        .eq('crew_id', crewId)
        .eq('is_active', true)
        .single()

      if (crewData) {
        setUserName(crewData.name || '')
        setUserNric(crewData.nric || '')
        setUserBasicSalary(compensationData?.basic_salary?.toString() || '')
        setEditingCrewId(crewId)
        setShowUserForm(true)
        setUserRole('employee')
      }
    } catch (error) {
      console.error('Error loading employee:', error)
      alert('Error loading employee data')
    }
  }

  async function updateEmployee() {
    if (!editingCrewId) return

    if (!userName || !userNric || !userBasicSalary) {
      alert('Please fill in all employee fields')
      return
    }

    setUpdating(true)

    try {
      // Update crew record
      const { error: crewError } = await supabase
        .from('crews')
        .update({
          name: userName,
          nric: userNric
        })
        .eq('id', editingCrewId)

      if (crewError) {
        alert('Error updating employee: ' + crewError.message)
        setUpdating(false)
        return
      }

      // Get current active compensation
      const { data: currentComp } = await supabase
        .from('crew_compensation')
        .select('id, basic_salary')
        .eq('crew_id', editingCrewId)
        .eq('is_active', true)
        .single()

      const newSalary = Number(userBasicSalary)

      // If salary changed, create new compensation record and deactivate old one
      if (currentComp && currentComp.basic_salary !== newSalary) {
        // Deactivate old record
        await supabase
          .from('crew_compensation')
          .update({ is_active: false })
          .eq('id', currentComp.id)

        // Create new compensation record
        const effectiveFrom = new Date().toISOString().split('T')[0]
        const { error: compError } = await supabase
          .from('crew_compensation')
          .insert({
            crew_id: editingCrewId,
            basic_salary: newSalary,
            is_active: true,
            effective_from: effectiveFrom
          })

        if (compError) {
          alert('Employee updated but failed to update compensation: ' + compError.message)
        } else {
          alert('Employee updated successfully')
        }
      } else if (!currentComp) {
        // No compensation record exists, create one
        const effectiveFrom = new Date().toISOString().split('T')[0]
        const { error: compError } = await supabase
          .from('crew_compensation')
          .insert({
            crew_id: editingCrewId,
            basic_salary: newSalary,
            is_active: true,
            effective_from: effectiveFrom
          })

        if (compError) {
          alert('Employee updated but failed to create compensation: ' + compError.message)
        } else {
          alert('Employee updated successfully')
        }
      } else {
        // Salary unchanged, just update the record
        const { error: compError } = await supabase
          .from('crew_compensation')
          .update({ basic_salary: newSalary })
          .eq('id', currentComp.id)

        if (compError) {
          alert('Employee updated but failed to update compensation: ' + compError.message)
        } else {
          alert('Employee updated successfully')
        }
      }

      // Reset form and reload
      resetForm()
      setShowUserForm(false)
      loadUsers()
      loadStats()
    } catch (error: any) {
      console.error('Error updating employee:', error)
      alert('Error updating employee: ' + (error.message || 'Unknown error'))
    } finally {
      setUpdating(false)
    }
  }

  async function createUser() {
    if (!userEmail || !userPassword) {
      alert('Please fill in email and password')
      return
    }

    if (userRole === 'employee' && (!userName || !userNric || !userBasicSalary)) {
      alert('Please fill in all employee fields')
      return
    }

    setCreating(true)

    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userEmail,
        password: userPassword,
        options: {
          data: {
            role: userRole,
            is_hr: userRole === 'hr',
            name: userName || userEmail.split('@')[0]
          },
          emailRedirectTo: undefined
        }
      })

      if (authError) {
        alert('Error creating user: ' + authError.message)
        setCreating(false)
        return
      }

      if (!authData.user) {
        alert('Failed to create user')
        setCreating(false)
        return
      }

      // If creating employee, also create crew record and crew_compensation
      if (userRole === 'employee' && authData.user.id) {
        // First create crew record
        const { data: crewData, error: crewError } = await supabase
          .from('crews')
          .insert({
            user_id: authData.user.id,
            name: userName,
            nric: userNric
          })
          .select('id')
          .single()

        if (crewError) {
          console.error('Error creating crew record:', crewError)
          alert('User created but failed to create employee record: ' + crewError.message)
        } else if (crewData?.id) {
          // Then create crew_compensation record
          // Use current date as effective_from since we don't have hire_date in admin form
          const now = new Date()
          const effectiveFrom = now.toISOString().split('T')[0] // YYYY-MM-DD format
          
          if (!effectiveFrom || effectiveFrom.length !== 10) {
            alert('Error: Failed to generate effective date')
            setCreating(false)
            return
          }
          
          const { error: compError } = await supabase
            .from('crew_compensation')
            .insert({
              crew_id: crewData.id,
              basic_salary: Number(userBasicSalary),
              is_active: true,
              effective_from: effectiveFrom
            })

          if (compError) {
            console.error('Error creating compensation record:', compError)
            alert('User and employee created but failed to create compensation record: ' + compError.message)
          } else {
            alert('User and employee record created successfully')
          }
        }
      } else if (userRole === 'hr') {
        alert('HR user created successfully')
      }

      // Reset form
      resetForm()
      setShowUserForm(false)

      // Reload data
      loadUsers()
      loadStats()
    } catch (error: any) {
      console.error('Error creating user:', error)
      alert('Error creating user: ' + (error.message || 'Unknown error'))
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Admin Dashboard</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Admin Dashboard</h1>
        <button
          onClick={() => setShowUserForm(!showUserForm)}
          style={{
            padding: '10px 20px',
            background: showUserForm ? '#6b7280' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          {showUserForm ? 'Cancel' : 'Create User'}
        </button>
      </div>

      {/* Create User Form */}
      {showUserForm && (
        <div style={{
          background: 'white',
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: 24,
          maxWidth: 600
        }}>
          <h2 style={{ marginTop: 0, marginBottom: 20 }}>
            {editingCrewId ? 'Edit Employee' : 'Create System User'}
          </h2>
          
          {!editingCrewId && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                  User Role *
                </label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as 'hr' | 'employee')}
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
                >
                  <option value="hr">HR</option>
                  <option value="employee">Employee</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="user@example.com"
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
                    Password *
                  </label>
                  <input
                    type="password"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
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
            </>
          )}

          {(userRole === 'employee' || editingCrewId) && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Employee name"
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
                    NRIC *
                  </label>
                  <input
                    type="text"
                    value={userNric}
                    onChange={(e) => setUserNric(e.target.value)}
                    placeholder="NRIC"
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
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500 }}>
                  Basic Salary *
                </label>
                <input
                  type="number"
                  value={userBasicSalary}
                  onChange={(e) => setUserBasicSalary(e.target.value)}
                  placeholder="0"
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
            </>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                resetForm()
                setShowUserForm(false)
              }}
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
            {editingCrewId ? (
              <button
                onClick={updateEmployee}
                disabled={updating}
                style={{
                  padding: '10px 20px',
                  background: updating ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: updating ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 500
                }}
              >
                {updating ? 'Updating...' : 'Update Employee'}
              </button>
            ) : (
              <button
                onClick={createUser}
                disabled={creating}
                style={{
                  padding: '10px 20px',
                  background: creating ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: creating ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 500
                }}
              >
                {creating ? 'Creating...' : 'Create User'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 20,
        marginTop: 30
      }}>
        <div style={{
          background: 'white',
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#6b7280', fontWeight: 500 }}>
            Total Employees
          </h3>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#1f2937' }}>
            {stats?.totalCrews || 0}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#6b7280', fontWeight: 500 }}>
            Total Payslips
          </h3>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#1f2937' }}>
            {stats?.totalPayslips || 0}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#6b7280', fontWeight: 500 }}>
            Salary Items
          </h3>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#1f2937' }}>
            {stats?.totalSalaryItems || 0}
          </div>
        </div>
      </div>

      {/* Users List */}
      <div style={{
        background: 'white',
        padding: 24,
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginTop: 30
      }}>
        <h2 style={{ marginTop: 0, marginBottom: 20 }}>System Users</h2>
        
        {users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
            <p>No users found.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table border={1} cellPadding={4}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>NRIC</th>
                  <th>Basic Salary</th>
                  <th>Role</th>
                  <th>Has Account</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.nric}</td>
                    <td>{user.basic_salary}</td>
                    <td>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                        background: user.user_id ? '#05966920' : '#f59e0b20',
                        color: user.user_id ? '#059669' : '#f59e0b'
                      }}>
                        {user.user_id ? 'Employee' : 'No Account'}
                      </span>
                    </td>
                    <td>
                      {user.user_id ? (
                        <span style={{ color: '#059669', fontSize: 12 }}>✓ Yes</span>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: 12 }}>No</span>
                      )}
                    </td>
                    <td>
                      {user.user_id && (
                        <button
                          onClick={() => loadEmployeeForEdit(user.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 500
                          }}
                        >
                          Edit
                        </button>
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

