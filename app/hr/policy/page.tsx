'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function HrPolicyPage() {
  const router = useRouter()
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({})
  
  // Form fields
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [content, setContent] = useState('')

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

      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading policies:', error)
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

  function resetForm() {
    setTitle('')
    setFile(null)
    setContent('')
    setEditingPolicy(null)
    setShowForm(false)
  }

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

  function startEdit(policy: any) {
    setEditingPolicy(policy)
    setTitle(policy.title || '')
    setContent(policy.content || '')
    setFile(null) // Don't pre-load file for editing
    setShowForm(true)
  }

  async function savePolicy() {
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }

    if (!editingPolicy && !file) {
      alert('Please upload a PDF file')
      return
    }

    try {
      setUploading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user?.id) {
        alert('Not authenticated')
        return
      }

      let fileUrl = editingPolicy?.file_url || ''

      // Upload file if it's a new file or replacing existing one
      if (file) {
        // Generate unique file name
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `policies/${fileName}`

        // Upload to Supabase Storage (bucket name is HRMSMVP, policies is a folder)
        const { error: uploadError } = await supabase.storage
          .from('HRMSMVP')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Error uploading file:', uploadError)
          alert('Error uploading file: ' + uploadError.message)
          setUploading(false)
          return
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('HRMSMVP')
          .getPublicUrl(filePath)

        if (urlData?.publicUrl) {
          fileUrl = urlData.publicUrl
        } else {
          // Fallback: construct URL manually if getPublicUrl fails
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
          fileUrl = `${supabaseUrl}/storage/v1/object/public/HRMSMVP/${filePath}`
        }

        // Delete old file if updating
        if (editingPolicy?.file_url) {
          // Extract file path from URL
          const urlParts = editingPolicy.file_url.split('/')
          const fileIndex = urlParts.findIndex((part: string) => part === 'policies')
          if (fileIndex !== -1) {
            const oldFilePath = urlParts.slice(fileIndex).join('/')
            await supabase.storage
              .from('HRMSMVP')
              .remove([oldFilePath])
          }
        }
      }

      // Save to database
      if (editingPolicy) {
        // Update existing policy
        const { error } = await supabase
          .from('policies')
          .update({
            title: title.trim(),
            file_url: fileUrl,
            content: content.trim() || null,
          })
          .eq('id', editingPolicy.id)

        if (error) {
          console.error('Error updating policy:', error)
          alert('Error updating policy: ' + error.message)
          setUploading(false)
          return
        }
      } else {
        // Create new policy
        const { error } = await supabase
          .from('policies')
          .insert({
            title: title.trim(),
            file_url: fileUrl,
            content: content.trim() || null,
            created_by: session.user.id
          })

        if (error) {
          console.error('Error creating policy:', error)
          alert('Error creating policy: ' + error.message)
          setUploading(false)
          return
        }
      }

      alert('Policy saved successfully')
      resetForm()
      load()
    } catch (error) {
      console.error('Error saving policy:', error)
      alert('Error saving policy')
    } finally {
      setUploading(false)
    }
  }

  async function deletePolicy(policy: any) {
    if (!confirm('Are you sure you want to delete this policy?')) {
      return
    }

    try {
      // Delete file from storage
      if (policy.file_url) {
        // Extract file path from URL
        const urlParts = policy.file_url.split('/')
        const fileIndex = urlParts.findIndex((part: string) => part === 'policies')
        if (fileIndex !== -1) {
          const filePath = urlParts.slice(fileIndex).join('/')
          await supabase.storage
            .from('HRMSMVP')
            .remove([filePath])
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('policies')
        .delete()
        .eq('id', policy.id)

      if (error) {
        console.error('Error deleting policy:', error)
        alert('Error deleting policy: ' + error.message)
        return
      }

      alert('Policy deleted successfully')
      load()
    } catch (error) {
      console.error('Error deleting policy:', error)
      alert('Error deleting policy')
    }
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Loading...</div>
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Policy Management</h1>
        <button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
          style={{
            padding: '10px 20px',
            background: showForm ? '#dc2626' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          {showForm ? 'Cancel' : 'Upload Policy'}
        </button>
      </div>

      {/* Policy Form */}
      {showForm && (
        <div style={{
          marginBottom: 30,
          padding: 24,
          background: 'white',
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: 20 }}>
            {editingPolicy ? 'Edit Policy' : 'Upload New Policy'}
          </h2>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: 14
              }}
              placeholder="Enter policy title"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              PDF File {!editingPolicy && '*'}
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0]
                if (selectedFile) {
                  if (selectedFile.type !== 'application/pdf') {
                    alert('Please upload a PDF file')
                    return
                  }
                  setFile(selectedFile)
                }
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: 14
              }}
            />
            {editingPolicy?.file_url && !file && (
              <p style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                Current file: <a href={fixFileUrl(editingPolicy.file_url)} target="_blank" rel="noopener noreferrer">View PDF</a>
              </p>
            )}
            {file && (
              <p style={{ marginTop: 8, fontSize: 12, color: '#059669' }}>
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Description (Optional)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
              placeholder="Enter policy description (optional)"
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={savePolicy}
              disabled={uploading}
              style={{
                padding: '10px 20px',
                background: uploading ? '#9ca3af' : '#059669',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontWeight: 500
              }}
            >
              {uploading ? 'Uploading...' : (editingPolicy ? 'Update Policy' : 'Upload Policy')}
            </button>
            <button
              onClick={resetForm}
              disabled={uploading}
              style={{
                padding: '10px 20px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontWeight: 500
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Policies List */}
      <div>
        <h2 style={{ marginBottom: 20 }}>Published Policies</h2>
        
        {policies.length === 0 ? (
          <div style={{
            padding: 40,
            background: '#f9fafb',
            borderRadius: 8,
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <p>No policies published yet.</p>
            <p style={{ marginTop: 8, fontSize: 14 }}>Click "Upload Policy" to upload a PDF file.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {policies.map((policy) => (
              <div
                key={policy.id}
                style={{
                  padding: 20,
                  background: 'white',
                  borderRadius: 8,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: 18,
                      fontWeight: 600,
                      marginBottom: 8,
                      color: '#111827'
                    }}>
                      {policy.title}
                    </h3>
                    {policy.created_at && (
                      <p style={{
                        fontSize: 14,
                        color: '#6b7280',
                        margin: 0,
                        marginBottom: 8
                      }}>
                        Created: {new Date(policy.created_at).toLocaleString()}
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
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => startEdit(policy)}
                      style={{
                        padding: '6px 12px',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 500
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePolicy(policy)}
                      style={{
                        padding: '6px 12px',
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 500
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {policy.content && (
                  <div style={{
                    fontSize: 15,
                    color: '#374151',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    paddingTop: 12,
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
    </div>
  )
}
