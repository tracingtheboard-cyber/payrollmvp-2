'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function HrNoticePage() {
  const router = useRouter()
  const [notices, setNotices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingNotice, setEditingNotice] = useState<any>(null)
  
  // Form fields
  const [title, setTitle] = useState('')
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
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading notices:', error)
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

  function resetForm() {
    setTitle('')
    setContent('')
    setEditingNotice(null)
    setShowForm(false)
  }

  function startEdit(notice: any) {
    setEditingNotice(notice)
    setTitle(notice.title || '')
    setContent(notice.content || notice.description || '')
    setShowForm(true)
  }

  async function saveNotice() {
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }

    try {
      if (editingNotice) {
        // Update existing notice
        const { error } = await supabase
          .from('notices')
          .update({
            title: title.trim(),
            content: content.trim()
          })
          .eq('id', editingNotice.id)

        if (error) {
          console.error('Error updating notice:', error)
          alert('Error updating notice: ' + error.message)
          return
        }
      } else {
        // Create new notice
        const { error } = await supabase
          .from('notices')
          .insert({
            title: title.trim(),
            content: content.trim()
          })

        if (error) {
          console.error('Error creating notice:', error)
          alert('Error creating notice: ' + error.message)
          return
        }
      }

      alert('Notice saved successfully')
      resetForm()
      load()
    } catch (error) {
      console.error('Error saving notice:', error)
      alert('Error saving notice')
    }
  }

  async function deleteNotice(id: string) {
    if (!confirm('Are you sure you want to delete this notice?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting notice:', error)
        alert('Error deleting notice: ' + error.message)
        return
      }

      alert('Notice deleted successfully')
      load()
    } catch (error) {
      console.error('Error deleting notice:', error)
      alert('Error deleting notice')
    }
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Loading...</div>
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Notice Management</h1>
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
          {showForm ? 'Cancel' : 'New Notice'}
        </button>
      </div>

      {/* Notice Form */}
      {showForm && (
        <div style={{
          marginBottom: 30,
          padding: 24,
          background: 'white',
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: 20 }}>
            {editingNotice ? 'Edit Notice' : 'New Notice'}
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
              placeholder="Enter notice title"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: 6,
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
              placeholder="Enter notice content"
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={saveNotice}
              style={{
                padding: '10px 20px',
                background: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {editingNotice ? 'Update Notice' : 'Publish Notice'}
            </button>
            <button
              onClick={resetForm}
              style={{
                padding: '10px 20px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notices List */}
      <div>
        <h2 style={{ marginBottom: 20 }}>Published Notices</h2>
        
        {notices.length === 0 ? (
          <div style={{
            padding: 40,
            background: '#f9fafb',
            borderRadius: 8,
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <p>No notices published yet.</p>
            <p style={{ marginTop: 8, fontSize: 14 }}>Click "New Notice" to publish one.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {notices.map((notice) => (
              <div
                key={notice.id}
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
                      {notice.title}
                    </h3>
                    {notice.created_at && (
                      <p style={{
                        fontSize: 14,
                        color: '#6b7280',
                        margin: 0
                      }}>
                        Published: {new Date(notice.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => startEdit(notice)}
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
                      onClick={() => deleteNotice(notice.id)}
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
                <div style={{
                  fontSize: 15,
                  color: '#374151',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  paddingTop: 12,
                  borderTop: '1px solid #e5e7eb'
                }}>
                  {notice.content || notice.description}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

