'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function EmployeePolicyPage() {
  const router = useRouter()
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    load()
  }, [])

  // Fix file URL if it points to wrong bucket
  function fixFileUrl(url: string): string {
    if (!url) return url
    
    // If URL already contains HRMSMVP, return as is
    if (url.includes('/HRMSMVP/') || url.includes('/HRMSMVP')) {
      return url
    }
    
    // Check if URL is a Supabase storage URL
    if (url.includes('/storage/v1/object/public/')) {
      // Extract the bucket name and path
      const match = url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/)
      if (match) {
        const currentBucket = match[1]
        const filePath = match[2]
        // Replace bucket name with HRMSMVP
        return url.replace(`/storage/v1/object/public/${currentBucket}/`, '/storage/v1/object/public/HRMSMVP/')
      }
    }
    
    // If URL doesn't match expected pattern but contains 'policies', try to fix it
    if (url.includes('policies') && !url.includes('HRMSMVP')) {
      // This is a fallback - try common patterns
      if (url.includes('/object/public/policies/')) {
        return url.replace('/object/public/policies/', '/object/public/HRMSMVP/policies/')
      }
    }
    
    return url
  }

  async function load() {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user?.id) {
        router.push('/login')
        return
      }

      // Load policies (assuming there's a policies table)
      // For now, this is a placeholder structure
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading policies:', error)
        // If table doesn't exist, just show empty state
        setPolicies([])
      } else {
        setPolicies(data || [])
        // Generate signed URLs for all policies as fallback
        const urlMap: Record<string, string> = {}
        for (const policy of (data || [])) {
          if (policy.file_url) {
            // Extract file path from URL
            const urlMatch = policy.file_url.match(/\/storage\/v1\/object\/[^\/]+\/[^\/]+\/(.+)/)
            if (urlMatch) {
              const filePath = urlMatch[1]
              try {
                const { data: signedData } = await supabase.storage
                  .from('HRMSMVP')
                  .createSignedUrl(filePath, 3600) // 1 hour expiry
                if (signedData?.signedUrl) {
                  urlMap[policy.id] = signedData.signedUrl
                }
              } catch (err) {
                console.error('Error creating signed URL:', err)
              }
            }
          }
        }
        setFileUrls(urlMap)
      }
    } catch (error) {
      console.error('Error loading policies:', error)
      setPolicies([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Policy</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Policy</h1>
      
      {policies.length === 0 ? (
        <div style={{
          marginTop: 20,
          padding: 40,
          background: '#f9fafb',
          borderRadius: 8,
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <p>No policies available at this time.</p>
          <p style={{ marginTop: 8, fontSize: 14 }}>HR will publish policies here.</p>
        </div>
      ) : (
        <div style={{ marginTop: 20 }}>
          {policies.map((policy) => (
            <div
              key={policy.id}
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
                {policy.title}
              </h2>
              {policy.created_at && (
                <p style={{
                  fontSize: 14,
                  color: '#6b7280',
                  marginBottom: 16
                }}>
                  Published: {new Date(policy.created_at).toLocaleDateString()}
                </p>
              )}
              {(policy.file_url || fileUrls[policy.id]) && (
                <a
                  href={fileUrls[policy.id] || fixFileUrl(policy.file_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    background: '#2563eb',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: 4,
                    fontSize: 14,
                    fontWeight: 500,
                    marginTop: 8
                  }}
                >
                  View PDF
                </a>
              )}
              {policy.content && (
                <div style={{
                  fontSize: 15,
                  color: '#374151',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: '1px solid #e5e7eb'
                }}>
                  {policy.content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

