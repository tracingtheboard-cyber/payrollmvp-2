'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userName, setUserName] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    loadUserInfo()
  }, [])

  async function loadUserInfo() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const userEmail = user.email || ''
    const isAdmin = userEmail.toLowerCase().includes('admin') || 
                    userEmail.toLowerCase().startsWith('admin@') ||
                    user.user_metadata?.role === 'admin' ||
                    user.user_metadata?.is_admin === true

    setUserRole(isAdmin ? 'Admin' : 'HR')
    setUserName(userEmail.split('@')[0] || userEmail)
  }

  // Base navigation items (HR users see these)
  const baseNavItems = [
    { href: '/salary', label: 'monthlysalary' },
    { href: '/run', label: 'Run Payroll' },
    { href: '/payslips', label: 'report' },
    { href: '/hr/leave', label: 'Leave Management' },
    { href: '/crews', label: 'Employees' },
    { href: '/hr/policy', label: 'Policy' },
    { href: '/hr/notice', label: 'Notice' },
  ]

  // Admin users see additional Admin link
  const navItems = userRole === 'Admin' 
    ? [{ href: '/admin', label: 'Admin' }, ...baseNavItems]
    : baseNavItems

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
          Payroll
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
              {userRole}
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


