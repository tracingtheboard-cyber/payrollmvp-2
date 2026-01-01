'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function EmployeeNoticePage() {
  const router = useRouter()
  const [notices, setNotices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user?.id) {
        router.push('/login')
        return
      }

      // Load notices (assuming there's a notices table)
      // For now, this is a placeholder structure
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading notices:', error)
        // If table doesn't exist, just show empty state
        setNotices([])
      } else {
        setNotices(data || [])
      }
    } catch (error) {
      console.error('Error loading notices:', error)
      setNotices([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Notice</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Notice</h1>
      
      {notices.length === 0 ? (
        <div style={{
          marginTop: 20,
          padding: 40,
          background: '#f9fafb',
          borderRadius: 8,
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <p>No notices available at this time.</p>
          <p style={{ marginTop: 8, fontSize: 14 }}>HR will publish notices here.</p>
        </div>
      ) : (
        <div style={{ marginTop: 20 }}>
          {notices.map((notice) => (
            <div
              key={notice.id}
              style={{
                marginBottom: 20,
                padding: 24,
                background: 'white',
                borderRadius: 8,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <h2 style={{
                fontSize: 20,
                fontWeight: 600,
                marginBottom: 12,
                color: '#111827'
              }}>
                {notice.title}
              </h2>
              {notice.created_at && (
                <p style={{
                  fontSize: 14,
                  color: '#6b7280',
                  marginBottom: 16
                }}>
                  Published: {new Date(notice.created_at).toLocaleDateString()}
                </p>
              )}
              <div style={{
                fontSize: 15,
                color: '#374151',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap'
              }}>
                {notice.content || notice.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

