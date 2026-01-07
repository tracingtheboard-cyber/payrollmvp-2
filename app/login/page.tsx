'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function login() {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      alert('Login failed')
      setLoading(false)
      return
    }

    // Check user role and redirect accordingly
    const userId = data.user.id
    const userEmail = data.user.email || ''
    
    // 1. Check if user is admin FIRST (highest priority)
    // Check email pattern or user_metadata
    const isAdmin = userEmail.toLowerCase().includes('admin') || 
                    userEmail.toLowerCase().startsWith('admin@') ||
                    data.user.user_metadata?.role === 'admin' ||
                    data.user.user_metadata?.is_admin === true

    if (isAdmin) {
      router.push('/admin')
      setLoading(false)
      return
    }

    // 2. Check if user has HR role in metadata (HR can also be employee)
    const isHR = data.user.user_metadata?.role === 'hr' ||
                 data.user.user_metadata?.is_hr === true

    if (isHR) {
      // User is HR (may also be employee, but prioritize HR dashboard)
      router.push('/hr/dashboard')
      setLoading(false)
      return
    }

    // 3. Check if user is an employee (has record in crews table)
    const { data: crew } = await supabase
      .from('crews')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (crew) {
      // User is an employee only (not HR)
      router.push('/employee/dashboard')
      setLoading(false)
      return
    }

    // 4. Default to HR dashboard (user not in crews table and no explicit role)
    router.push('/hr/dashboard')
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: '48px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: 32
        }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            color: '#1f2937',
            margin: '0 0 8px 0'
          }}>
            Welcome Back
          </h1>
          <p style={{
            fontSize: 16,
            color: '#6b7280',
            margin: 0
          }}>
            Sign in to your account
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 500,
            color: '#374151',
            marginBottom: 8
          }}>
            Email
          </label>
          <input 
            placeholder="Enter your email" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 14,
              border: '2px solid #e5e7eb',
              borderRadius: 8,
              outline: 'none',
              transition: 'all 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea'
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: 32 }}>
          <label style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 500,
            color: '#374151',
            marginBottom: 8
          }}>
            Password
          </label>
          <input 
            type="password" 
            placeholder="Enter your password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 14,
              border: '2px solid #e5e7eb',
              borderRadius: 8,
              outline: 'none',
              transition: 'all 0.2s',
              boxSizing: 'border-box'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) {
                login()
              }
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea'
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        <button 
          onClick={login}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 16,
            fontWeight: 600,
            transition: 'all 0.2s',
            boxShadow: loading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)'
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
            }
          }}
        >
          {loading ? 'Logging in...' : 'Sign In'}
        </button>
      </div>
    </div>
  )
}



