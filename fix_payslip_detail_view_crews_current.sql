-- Fix payslip_detail_view by replacing 'crews' with 'crews_current'
-- This way, c.basic_salary will automatically read from crew_compensation

-- Step 1: View the current payslip_detail_view definition
-- Run this first to see what the view currently looks like:
-- SELECT pg_get_viewdef('payslip_detail_view', true);

-- Step 2: Drop the existing view
DROP VIEW IF EXISTS payslip_detail_view CASCADE;

-- Step 3: Recreate the view using crews_current instead of crews
-- IMPORTANT: Replace all occurrences of "FROM crews" or "FROM crews c" with "FROM crews_current c"
-- The rest of the SELECT statement should remain the same

-- Example template (you need to adjust based on your actual view):
CREATE OR REPLACE VIEW payslip_detail_view AS
SELECT 
  c.id AS crew_id,
  c.name,
  si.month,
  c.basic_salary,  -- This will now automatically read from crew_compensation via crews_current
  COALESCE(si.allowance, 0) AS allowance,
  COALESCE(si.overtime, 0) AS overtime,
  COALESCE(si.bonus, 0) AS bonus,
  COALESCE(si.unutilised_leave_pay, 0) AS unutilised_leave_pay,
  COALESCE(si.unpaid_leave_deduction, 0) AS unpaid_leave_deduction,
  COALESCE(si.advance_deduction, 0) AS advance_deduction,
  COALESCE(si.adjustment, 0) AS adjustment,
  -- Add other fields as needed (gross, employee_cpf, employer_cpf, sdl, welfare, total_deduction, net_pay)
  -- Keep your existing calculation logic
FROM crews_current c  -- Changed from 'crews' to 'crews_current'
LEFT JOIN salary_items si ON c.id = si.crew_id;
-- Add other joins as needed (e.g., payslips table)

-- Note: 
-- 1. First, run "SELECT pg_get_viewdef('payslip_detail_view', true);" to see the full view definition
-- 2. Copy that definition and replace "FROM crews" with "FROM crews_current" (keep the alias 'c')
-- 3. All references to c.basic_salary will then automatically work
-- 4. No need to change field names or frontend logic

