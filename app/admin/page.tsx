'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showUserForm, setShowUserForm] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  
  // User creation form fields
  const [userEmail, setUserEmail] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const [userRole, setUserRole] = useState<'hr' | 'employee'>('employee')
  const [userName, setUserName] = useState('')
  const [userNric, setUserNric] = useState('')
  const [userBasicSalary, setUserBasicSalary] = useState('')
  const [creating, setCreating] = useState(false)

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
        .select('id, name, nric, basic_salary, user_id')
        .order('name')

      // Note: We can't directly query auth.users from frontend
      // This is a simplified view showing crews with user_id
      setUsers(crews || [])
    } catch (error) {
      console.error('Error loading users:', error)
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

      // If creating employee, also create crew record
      if (userRole === 'employee' && authData.user.id) {
        const { error: crewError } = await supabase
          .from('crews')
          .insert({
            user_id: authData.user.id,
            name: userName,
            nric: userNric,
            basic_salary: Number(userBasicSalary)
          })

        if (crewError) {
          console.error('Error creating crew record:', crewError)
          alert('User created but failed to create employee record: ' + crewError.message)
        } else {
          alert('User and employee record created successfully')
        }
      } else if (userRole === 'hr') {
        alert('HR user created successfully')
      }

      // Reset form
      setUserEmail('')
      setUserPassword('')
      setUserRole('employee')
      setUserName('')
      setUserNric('')
      setUserBasicSalary('')
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
          <h2 style={{ marginTop: 0, marginBottom: 20 }}>Create System User</h2>
          
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

          {userRole === 'employee' && (
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
              onClick={() => setShowUserForm(false)}
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

