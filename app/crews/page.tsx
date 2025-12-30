'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function CrewsPage() {
  const [name, setName] = useState('')
  const [nric, setNric] = useState('')
  const [basicSalary, setBasicSalary] = useState('')
  const [crews, setCrews] = useState<any[]>([])

  async function loadCrews() {
    const { data } = await supabase
      .from('crews')
      .select('*')
      .order('created_at', { ascending: false })

    setCrews(data || [])
  }

  async function addCrew() {
    await supabase.from('crews').insert({
      name,
      nric,
      basic_salary: Number(basicSalary)
    })

    setName('')
    setNric('')
    setBasicSalary('')
    loadCrews()
  }

  useEffect(() => {
    loadCrews()
  }, [])

  return (
  <div className="container">
      <h1>Employees</h1>

    <div className="form-row">
      <input
        placeholder="Name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <input
        placeholder="NRIC"
        value={nric}
        onChange={e => setNric(e.target.value)}
      />
      <input
        placeholder="Basic Salary"
        value={basicSalary}
        onChange={e => setBasicSalary(e.target.value)}
      />
      <button onClick={addCrew}>Add</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>NRIC</th>
          <th>Basic Salary</th>
        </tr>
      </thead>
      <tbody>
        {crews.map(c => (
          <tr key={c.id}>
            <td>{c.name}</td>
            <td>{c.nric}</td>
            <td>{c.basic_salary}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

}
