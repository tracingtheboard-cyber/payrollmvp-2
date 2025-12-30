'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from './Sidebar'
import EmployeeSidebar from './EmployeeSidebar'

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState<'employee' | 'hr' | 'admin' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUserRole()
  }, [pathname])

  async function checkUserRole() {
    // Don't check on login page
    if (pathname === '/login') {
      setUserRole(null)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Not logged in, redirect to login if not on login page
      if (pathname !== '/login') {
        router.push('/login')
      }
      setUserRole(null)
      setLoading(false)
      return
    }

    const userId = user.id
    const userEmail = user.email || ''

    // Check if user is admin
    const isAdmin = userEmail.toLowerCase().includes('admin') || 
                    userEmail.toLowerCase().startsWith('admin@') ||
                    user.user_metadata?.role === 'admin' ||
                    user.user_metadata?.is_admin === true

    if (isAdmin) {
      setUserRole('admin')
      setLoading(false)
      return
    }

    // Check if user has HR role in metadata
    const isHR = user.user_metadata?.role === 'hr' ||
                 user.user_metadata?.is_hr === true

    // Check if user is an employee (has record in crews table)
    const { data: crew } = await supabase
      .from('crews')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (isHR) {
      // User is HR (can be both HR and employee)
      setUserRole('hr')
      setLoading(false)
      return
    }

    if (crew) {
      // User is employee only (not HR)
      setUserRole('employee')
      // Protect employee routes - redirect if accessing non-employee pages
      // Allow employee pages and payslip detail pages (for viewing own payslips)
      const isEmployeePath = pathname.startsWith('/employee') || pathname.startsWith('/payslips/')
      
      if (!isEmployeePath && pathname !== '/login') {
        router.push('/employee/dashboard')
        setLoading(false)
        return
      }
      setLoading(false)
      return
    }

    // Default to HR (user not in crews table and no explicit role)
    setUserRole('hr')
    setLoading(false)
  }

  // Show appropriate sidebar based on user role
  const showEmployeeSidebar = !loading && userRole === 'employee' && pathname.startsWith('/employee')
  const showHRSidebar = !loading && userRole === 'hr' && pathname !== '/login' && !pathname.startsWith('/employee')
  const showAdminSidebar = !loading && userRole === 'admin' && pathname !== '/login' && !pathname.startsWith('/employee')

  const showSidebar = showEmployeeSidebar || showHRSidebar || showAdminSidebar

  return (
    <>
      {showEmployeeSidebar && <EmployeeSidebar />}
      {showHRSidebar && <Sidebar />}
      {showAdminSidebar && <Sidebar />}
      <div style={{ marginLeft: showSidebar ? 200 : 0 }}>
        {children}
      </div>
    </>
  )
}




