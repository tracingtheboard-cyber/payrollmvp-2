'use client'

import { useEffect, useState } from 'react'

export default function MonthSelector({ value, onChange }: { value: string; onChange: (month: string) => void }) {
  const [months, setMonths] = useState<string[]>([])

  useEffect(() => {
    // 生成最近12个月的选项
    const options: string[] = []
    const today = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      options.push(`${year}-${month}`)
    }
    setMonths(options)
  }, [])

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '8px 12px',
        fontSize: 14,
        borderRadius: 6,
        border: '1px solid #ddd',
        background: 'white',
        cursor: 'pointer'
      }}
    >
      {months.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </select>
  )
}






