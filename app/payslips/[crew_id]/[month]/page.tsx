'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import html2pdf from 'html2pdf.js'

export default function PayslipPrintPage() {
  const { crew_id, month } = useParams() as { crew_id: string; month: string }
  const router = useRouter()
  const [d, setD] = useState<any>(null)
  const [employeeNo, setEmployeeNo] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        router.push('/login')
        return
      }

      // Check if user is an employee - verify they can only view their own payslip
      const { data: crew } = await supabase
        .from('crews')
        .select('id, user_id, employee_no')
        .eq('user_id', session.user.id)
        .single()

      // If user is an employee, they can only view their own payslip
      if (crew && crew.id !== crew_id) {
        setUnauthorized(true)
        setLoading(false)
        return
      }

      // Load crew info for employee number
      const { data: crewInfo } = await supabase
        .from('crews')
        .select('employee_no')
        .eq('id', crew_id)
        .single()

      // Set employee number if available, otherwise use crew_id last 8 chars as fallback
      if (crewInfo?.employee_no) {
        setEmployeeNo(crewInfo.employee_no)
      } else {
        // Fallback: use last 8 characters of crew_id
        setEmployeeNo(crew_id.slice(-8))
      }

      // Load payslip data
      const { data, error } = await supabase
        .from('payslip_detail_view')
        .select('*')
        .eq('crew_id', crew_id)
        .eq('month', month)
        .single()

      if (error) {
        alert(error.message)
        setLoading(false)
        return
      }

      setD(data)
    } catch (error) {
      console.error('Error loading payslip:', error)
      setUnauthorized(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>Unauthorized Access</h2>
        <p>You can only view your own payslips.</p>
        <button
          onClick={() => router.push('/employee/dashboard')}
          style={{
            padding: '10px 20px',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            marginTop: 20
          }}
        >
          Go to Dashboard
        </button>
      </div>
    )
  }

  if (!d) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p>Payslip not found.</p>
      </div>
    )
  }

  function downloadPDF() {
    const element = document.getElementById('payslip')
    const noPrintElements = document.querySelectorAll('.no-print') as NodeListOf<HTMLElement>
    
    if (element) {
      // Hide all buttons before generating PDF
      const originalDisplays: string[] = []
      noPrintElements.forEach((el) => {
        originalDisplays.push(el.style.display)
        el.style.display = 'none'
      })
      
      // Check content height to determine if we need multiple pages
      const contentHeight = element.scrollHeight
      const a4HeightPx = 1123 // A4 height in pixels at 96 DPI (297mm)
      
      html2pdf()
        .set({
          margin: [0, 0, 0, 0],
          filename: `Payslip-${d.name}-${d.month}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            logging: false,
            windowWidth: element.scrollWidth,
            windowHeight: contentHeight
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait'
          }
        })
        .from(element)
        .toPdf()
        .get('pdf')
        .then((pdf: any) => {
          // Remove blank pages at the end
          const totalPages = pdf.internal.getNumberOfPages()
          
          // If content fits on one page but multiple pages were created, remove extra pages
          if (totalPages > 1 && contentHeight < a4HeightPx) {
            // Delete all pages after the first one
            for (let i = totalPages; i > 1; i--) {
              pdf.deletePage(i)
            }
          } else if (totalPages > 1) {
            // Check if the last page is blank
            pdf.setPage(totalPages)
            // Get the page info - if it's essentially empty, remove it
            // This is a heuristic: if content height suggests it should fit on fewer pages
            const expectedPages = Math.ceil(contentHeight / a4HeightPx)
            if (totalPages > expectedPages) {
              // Remove extra pages
              for (let i = totalPages; i > expectedPages; i--) {
                pdf.deletePage(i)
              }
            }
          }
          
          // Save the PDF
          pdf.save(`Payslip-${d.name}-${d.month}.pdf`)
          
          // Show buttons again after PDF is generated
          noPrintElements.forEach((el, index) => {
            el.style.display = originalDisplays[index] || ''
          })
        })
        .catch((error) => {
          console.error('Error generating PDF:', error)
          // Fallback to simple save if advanced processing fails
          html2pdf()
            .set({
              margin: 0,
              filename: `Payslip-${d.name}-${d.month}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            })
            .from(element)
            .save()
            .then(() => {
              noPrintElements.forEach((el, index) => {
                el.style.display = originalDisplays[index] || ''
              })
            })
            .catch((err) => {
              console.error('Fallback PDF generation also failed:', err)
              noPrintElements.forEach((el, index) => {
                el.style.display = originalDisplays[index] || ''
              })
            })
        })
    }
  }

  // Format month for display (e.g., "01st November to 30th November 2025")
  function formatMonthRange(monthStr: string) {
    try {
      const [year, month] = monthStr.split('-')
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December']
      const monthIndex = parseInt(month) - 1
      const monthName = monthNames[monthIndex] || month
      
      // Get last day of month
      const lastDay = new Date(parseInt(year), monthIndex + 1, 0).getDate()
      const daySuffix = (day: number) => {
        if (day > 3 && day < 21) return 'th'
        switch (day % 10) {
          case 1: return 'st'
          case 2: return 'nd'
          case 3: return 'rd'
          default: return 'th'
        }
      }
      
      return `01${daySuffix(1)} ${monthName} to ${lastDay}${daySuffix(lastDay)} ${year}`
    } catch {
      return `Payslip for ${monthStr}`
    }
  }

  // Format currency
  function formatCurrency(amount: number | null | undefined) {
    if (amount === null || amount === undefined) return '0.00'
    return Number(amount).toFixed(2)
  }

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div id="payslip" style={{
        width: '210mm',
        minHeight: '297mm',
        margin: 'auto',
        padding: '25mm',
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        background: '#fff',
        color: '#000',
        boxShadow: '0 0 20px rgba(0,0,0,0.1)'
      }}>

        {/* Header Section */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: 30,
          borderBottom: '2px solid #2563eb',
          paddingBottom: 15
        }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1e40af', marginBottom: 5 }}>
              CACTUS GROUP (PTE. LTD.)
            </div>
            <div style={{ fontSize: '10px', color: '#6b7280' }}>
              Co. Reg. 201400388E
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>
              {formatMonthRange(month)}
            </div>
            <div className="no-print">
              <button 
                onClick={() => window.print()}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                Print #{crew_id.slice(-6)}
              </button>
            </div>
          </div>
        </div>

        {/* Company and Employee Information - Two Column Layout */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 30,
          marginBottom: 30
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: 12, color: '#1f2937' }}>
              CACTUS GROUP (PTE. LTD.)
            </div>
            <div style={{ fontSize: '11px', color: '#4b5563', lineHeight: 1.8 }}>
              {employeeNo && <div><strong>Employee No.:</strong> {employeeNo}</div>}
              <div><strong>Name:</strong> {d.name}</div>
              <div><strong>NRIC:</strong> {d.nric || 'N/A'}</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: 12, color: '#1f2937' }}>
              Project Information
            </div>
            <div style={{ fontSize: '11px', color: '#4b5563', lineHeight: 1.8 }}>
              <div><strong>Currency:</strong> SGD</div>
              <div><strong>Department:</strong> General</div>
            </div>
          </div>
        </div>

        {/* Earnings Section */}
        <div style={{ marginBottom: 25 }}>
          <h3 style={{ 
            fontSize: '13px', 
            fontWeight: 700, 
            marginBottom: 12,
            color: '#1f2937',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: 8
          }}>
            Earnings
          </h3>
          <table width="100%" style={{ 
            borderCollapse: 'collapse',
            border: '1px solid #d1d5db'
          }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ 
                  padding: '10px 8px', 
                  textAlign: 'left', 
                  border: '1px solid #d1d5db',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#374151'
                }}>Earnings</th>
                <th style={{ 
                  padding: '10px 8px', 
                  textAlign: 'right', 
                  border: '1px solid #d1d5db',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#374151'
                }}>Rate</th>
                <th style={{ 
                  padding: '10px 8px', 
                  textAlign: 'right', 
                  border: '1px solid #d1d5db',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#374151'
                }}>Days / Hours</th>
                <th style={{ 
                  padding: '10px 8px', 
                  textAlign: 'right', 
                  border: '1px solid #d1d5db',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#374151'
                }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Normal Working</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>
                  {formatCurrency(d.basic_salary)}
                </td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>1</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>
                  {formatCurrency(d.basic_salary)}
                </td>
              </tr>
              {Number(d.allowance) > 0 && (
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Allowance</td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>
                    {formatCurrency(d.allowance)}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>1</td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>
                    {formatCurrency(d.allowance)}
                  </td>
                </tr>
              )}
              {Number(d.overtime) > 0 && (
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Over-time</td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>
                    {formatCurrency(d.overtime)}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>0.00</td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>
                    {formatCurrency(d.overtime)}
                  </td>
                </tr>
              )}
              {Number(d.bonus) > 0 && (
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Bonus</td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>-</td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>-</td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>
                    {formatCurrency(d.bonus)}
                  </td>
                </tr>
              )}
              {Number(d.unutilised_leave_pay) > 0 && (
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Unutilised Leave</td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>-</td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>-</td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>
                    {formatCurrency(d.unutilised_leave_pay)}
                  </td>
                </tr>
              )}
              <tr style={{ background: '#f9fafb', fontWeight: 700 }}>
                <td style={{ padding: '10px 8px', border: '1px solid #d1d5db' }}>Total Earnings</td>
                <td style={{ padding: '10px 8px', border: '1px solid #d1d5db', textAlign: 'right' }}></td>
                <td style={{ padding: '10px 8px', border: '1px solid #d1d5db', textAlign: 'right' }}></td>
                <td style={{ padding: '10px 8px', border: '1px solid #d1d5db', textAlign: 'right', fontSize: '12px' }}>
                  {formatCurrency(d.gross)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Other Items Section */}
        <div style={{ marginBottom: 25 }}>
          <h3 style={{ 
            fontSize: '13px', 
            fontWeight: 700, 
            marginBottom: 12,
            color: '#1f2937',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: 8
          }}>
            Other Items
          </h3>
          <table width="100%" style={{ 
            borderCollapse: 'collapse',
            border: '1px solid #d1d5db'
          }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ 
                  padding: '10px 8px', 
                  textAlign: 'left', 
                  border: '1px solid #d1d5db',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#374151'
                }}>Other Item</th>
                <th style={{ 
                  padding: '10px 8px', 
                  textAlign: 'right', 
                  border: '1px solid #d1d5db',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#374151'
                }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {Number(d.advance_deduction) > 0 && (
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Cash Advance</td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>
                    {formatCurrency(d.advance_deduction)}
                  </td>
                </tr>
              )}
              {Number(d.employee_cpf) > 0 && (
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Employee CPF</td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>
                    {formatCurrency(d.employee_cpf)}
                  </td>
                </tr>
              )}
              {Number(d.sdl) > 0 && (
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>SDL</td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>
                    {formatCurrency(d.sdl)}
                  </td>
                </tr>
              )}
              {Number(d.welfare) > 0 && (
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Welfare</td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>
                    {formatCurrency(d.welfare)}
                  </td>
                </tr>
              )}
              {Number(d.unpaid_leave_deduction) > 0 && (
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Unpaid Leave Deduction</td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>
                    {formatCurrency(d.unpaid_leave_deduction)}
                  </td>
                </tr>
              )}
              {(Number(d.advance_deduction) === 0 && 
                Number(d.employee_cpf) === 0 && 
                Number(d.sdl) === 0 && 
                Number(d.welfare) === 0 && 
                Number(d.unpaid_leave_deduction) === 0) && (
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Claims / Other Deduction</td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'right' }}>0.00</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Net Pay */}
        <div style={{ 
          marginTop: 30,
          marginBottom: 30,
          padding: '20px',
          background: '#eff6ff',
          border: '2px solid #2563eb',
          borderRadius: 8,
          textAlign: 'right'
        }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 700, 
            color: '#1e40af'
          }}>
            Net Pay: {formatCurrency(d.net_pay)}
          </div>
        </div>

        {/* Bank Information Section */}
        <div style={{ 
          marginTop: 30,
          padding: '15px',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: 6
        }}>
          <h3 style={{ 
            fontSize: '12px', 
            fontWeight: 600, 
            marginBottom: 12,
            color: '#1f2937'
          }}>
            Bank Information
          </h3>
          <div style={{ fontSize: '11px', color: '#4b5563', lineHeight: 1.8 }}>
            <div><strong>Bank Name:</strong> {d.bank_name || 'N/A'}</div>
            <div><strong>Account Name:</strong> {d.name}</div>
            <div><strong>Account No.:</strong> {d.account_number || 'N/A'}</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: 40, 
          fontSize: '10px',
          color: '#6b7280',
          textAlign: 'center',
          borderTop: '1px solid #e5e7eb',
          paddingTop: 15
        }}>
          This is a computer generated payslip. No signature is required.
        </div>

        {/* Action Buttons - No Print */}
        <div className="no-print" style={{ 
          marginTop: 20, 
          textAlign: 'center',
          padding: '20px'
        }}>
          <button 
            onClick={downloadPDF}
            style={{
              padding: '12px 24px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              marginRight: 10
            }}
          >
            Download PDF
          </button>
          <button 
            onClick={() => window.print()}
            style={{
              padding: '12px 24px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            Print
          </button>
        </div>

      </div>
    </div>
  )
}
