'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function CrewsPage() {
  // Basic Info
  const [name, setName] = useState('')
  const [nric, setNric] = useState('')
  const [fullName, setFullName] = useState('')
  const [gender, setGender] = useState('')
  const [race, setRace] = useState('')
  const [nationality, setNationality] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')

  // PR Info
  const [prStartDate, setPrStartDate] = useState('')
  const [prYear, setPrYear] = useState('')

  // Employment Info
  const [hireDate, setHireDate] = useState('')
  const [terminationDate, setTerminationDate] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Payment Info
  const [payMode, setPayMode] = useState('GIRO')
  const [bankName, setBankName] = useState('')
  const [bankCode, setBankCode] = useState('')
  const [branchCode, setBranchCode] = useState('')
  const [bankAccountNo, setBankAccountNo] = useState('')

  // Salary Info
  const [basicSalary, setBasicSalary] = useState('')

  const [crews, setCrews] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)

  async function loadCrews() {
    // Load crews
    const { data: crewsData } = await supabase
      .from('crews')
      .select('*')
      .order('created_at', { ascending: false })

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

    const crewsWithSalary = (crewsData || []).map(c => ({
      ...c,
      basic_salary: compensationMap[c.id]?.basic_salary || null
    }))

    setCrews(crewsWithSalary)
  }

  function resetForm() {
    setName('')
    setNric('')
    setFullName('')
    setGender('')
    setRace('')
    setNationality('')
    setDateOfBirth('')
    setPrStartDate('')
    setPrYear('')
    setHireDate('')
    setTerminationDate('')
    setJobTitle('')
    setIsActive(true)
    setPayMode('GIRO')
    setBankName('')
    setBankCode('')
    setBranchCode('')
    setBankAccountNo('')
    setBasicSalary('')
  }

  async function addCrew() {
    // Validation: name and nric are required
    if (!name || !nric) {
      alert('Name and NRIC are required')
      return
    }

    // First create crew record
    const crewData: any = {
      name,
      nric,
      full_name: fullName || null,
      gender: gender || null,
      race: race || null,
      nationality: nationality || null,
      date_of_birth: dateOfBirth || null,
      pr_start_date: prStartDate || null,
      pr_year: prYear ? Number(prYear) : null,
      hire_date: hireDate || null,
      termination_date: terminationDate || null,
      job_title: jobTitle || null,
      is_active: isActive,
      pay_mode: payMode || 'GIRO',
      bank_name: bankName || null,
      bank_code: bankCode || null,
      branch_code: branchCode || null,
      bank_account_no: bankAccountNo || null
    }

    const { data: crewResult, error: crewError } = await supabase
      .from('crews')
      .insert(crewData)
      .select('id')
      .single()

    if (crewError) {
      alert('Error creating employee: ' + crewError.message)
      return
    }

    // Then create crew_compensation record if basic salary is provided
    if (crewResult?.id && basicSalary) {
      const { error: compError } = await supabase
        .from('crew_compensation')
        .insert({
          crew_id: crewResult.id,
          basic_salary: Number(basicSalary),
          is_active: true
        })

      if (compError) {
        alert('Employee created but failed to create compensation record: ' + compError.message)
        return
      }
    }

    alert('Employee created successfully')
    resetForm()
    setShowForm(false)
    loadCrews()
  }

  useEffect(() => {
    loadCrews()
  }, [])

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Employees</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: showForm ? '#6b7280' : '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          {showForm ? 'Cancel' : 'Add Employee'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: 24 }}>
          <h2 style={{ marginTop: 0, marginBottom: 20 }}>Add New Employee</h2>

          {/* Basic Information */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600, color: '#374151' }}>Basic Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Name"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>NRIC *</label>
                <input
                  type="text"
                  value={nric}
                  onChange={e => setNric(e.target.value)}
                  placeholder="NRIC"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Full Name"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Gender</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box', background: 'white' }}
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Race</label>
                <input
                  type="text"
                  value={race}
                  onChange={e => setRace(e.target.value)}
                  placeholder="Race"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Nationality</label>
                <input
                  type="text"
                  value={nationality}
                  onChange={e => setNationality(e.target.value)}
                  placeholder="Nationality"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          {/* PR Information */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600, color: '#374151' }}>PR Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>PR Start Date</label>
                <input
                  type="date"
                  value={prStartDate}
                  onChange={e => setPrStartDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>PR Year</label>
                <input
                  type="number"
                  value={prYear}
                  onChange={e => setPrYear(e.target.value)}
                  placeholder="PR Year"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600, color: '#374151' }}>Employment Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Hire Date</label>
                <input
                  type="date"
                  value={hireDate}
                  onChange={e => setHireDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Termination Date</label>
                <input
                  type="date"
                  value={terminationDate}
                  onChange={e => setTerminationDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  placeholder="Job Title"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Active Status</label>
                <select
                  value={isActive ? 'true' : 'false'}
                  onChange={e => setIsActive(e.target.value === 'true')}
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box', background: 'white' }}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600, color: '#374151' }}>Payment Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Pay Mode</label>
                <select
                  value={payMode}
                  onChange={e => setPayMode(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box', background: 'white' }}
                >
                  <option value="GIRO">GIRO</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  placeholder="Bank Name"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Bank Code</label>
                <input
                  type="text"
                  value={bankCode}
                  onChange={e => setBankCode(e.target.value)}
                  placeholder="Bank Code"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Branch Code</label>
                <input
                  type="text"
                  value={branchCode}
                  onChange={e => setBranchCode(e.target.value)}
                  placeholder="Branch Code"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Bank Account No</label>
                <input
                  type="text"
                  value={bankAccountNo}
                  onChange={e => setBankAccountNo(e.target.value)}
                  placeholder="Bank Account Number"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          {/* Salary Information */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 12, fontSize: 16, fontWeight: 600, color: '#374151' }}>Salary Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Basic Salary</label>
                <input
                  type="number"
                  value={basicSalary}
                  onChange={e => setBasicSalary(e.target.value)}
                  placeholder="Basic Salary"
                  style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #d1d5db', borderRadius: 6, boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                resetForm()
                setShowForm(false)
              }}
              style={{ padding: '10px 20px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
            >
              Cancel
            </button>
            <button
              onClick={addCrew}
              style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
            >
              Add Employee
            </button>
          </div>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>NRIC</th>
            <th>Full Name</th>
            <th>Job Title</th>
            <th>Basic Salary</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {crews.map(c => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.nric}</td>
              <td>{c.full_name || '-'}</td>
              <td>{c.job_title || '-'}</td>
              <td>{c.basic_salary || '-'}</td>
              <td>{c.is_active ? 'Active' : 'Inactive'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
