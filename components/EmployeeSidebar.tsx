'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EmployeeSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userName, setUserName] = useState<string>('')

  useEffect(() => {
    loadUserInfo()
  }, [])

  async function loadUserInfo() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) return

    const { data: crew } = await supabase
      .from('crews')
      .select('name')
      .eq('user_id', session.user.id)
      .single()

    if (crew) {
      setUserName(crew.name)
    } else {
      const userEmail = session.user.email || ''
      setUserName(userEmail.split('@')[0] || userEmail)
    }
  }

  const navItems = [
    { href: '/employee/payslips', label: 'Payslips' },
    { href: '/employee/leave', label: 'Leave' },
  ]

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{
        width: 200,
        minHeight: '100vh',
        background: '#1f2937',
        padding: '20px 0',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
      }}>
      <div style={{ padding: '0 20px', marginBottom: 30 }}>
        <h2 style={{ 
          color: 'white', 
          fontSize: 20, 
          fontWeight: 700,
          margin: '0 0 12px 0'
        }}>
          Employee Portal
        </h2>
        {userName && (
          <div style={{
            paddingTop: 12,
            borderTop: '1px solid #374151'
          }}>
            <div style={{
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 4
            }}>
              {userName}
            </div>
            <div style={{
              color: '#9ca3af',
              fontSize: 12,
              fontWeight: 500
            }}>
              Employee
            </div>
          </div>
        )}
      </div>
      <nav style={{ flex: 1 }}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'block',
              padding: '12px 20px',
              color: pathname === item.href ? '#ffffff' : '#d1d5db',
              background: pathname === item.href ? '#3b82f6' : 'transparent',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: pathname === item.href ? 600 : 500,
              transition: 'all 0.2s',
              borderLeft: pathname === item.href ? '3px solid #60a5fa' : '3px solid transparent'
            }}
            onMouseEnter={(e) => {
              if (pathname !== item.href) {
                e.currentTarget.style.background = '#374151'
              }
            }}
            onMouseLeave={(e) => {
              if (pathname !== item.href) {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div style={{ padding: '20px', borderTop: '1px solid #374151' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '12px 20px',
            background: 'transparent',
            color: '#d1d5db',
            border: '1px solid #374151',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#374151'
            e.currentTarget.style.color = '#ffffff'
            e.currentTarget.style.borderColor = '#4b5563'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#d1d5db'
            e.currentTarget.style.borderColor = '#374151'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  )
}

