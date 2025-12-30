'use client'

import { useState, useEffect } from 'react'

const MONTH_STORAGE_KEY = 'selected_month'

export function useMonth() {
  const [month, setMonth] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(MONTH_STORAGE_KEY)
      if (stored) return stored
    }
    // 默认当前月份
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(MONTH_STORAGE_KEY, month)
    }
  }, [month])

  return [month, setMonth] as const
}






