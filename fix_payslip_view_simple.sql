-- Simple fix: Update payslip_detail_view to use crews_current
-- This will fix the "column c.basic_salary does not exist" error

-- Step 1: Drop the existing view
DROP VIEW IF EXISTS payslip_detail_view CASCADE;

-- Step 2: You need to get the current view definition first
-- Run this in SQL Editor to see the full definition:
-- SELECT pg_get_viewdef('payslip_detail_view', true);

-- Step 3: Copy the output from Step 2, then:
--   - Find all "FROM crews" or "FROM crews c"
--   - Replace with "FROM crews_current c"
--   - Then run the modified CREATE VIEW statement

-- TEMPORARY FIX: If you need a quick fix, use this basic version:
-- (You may need to adjust based on your actual view structure)

CREATE OR REPLACE VIEW payslip_detail_view AS
SELECT 
  c.id AS crew_id,
  c.name,
  si.month,
  c.basic_salary,  -- This will now read from crew_compensation via crews_current
  COALESCE(si.allowance, 0) AS allowance,
  COALESCE(si.overtime, 0) AS overtime,
  COALESCE(si.bonus, 0) AS bonus,
  COALESCE(si.unutilised_leave_pay, 0) AS unutilised_leave_pay,
  COALESCE(si.unpaid_leave_deduction, 0) AS unpaid_leave_deduction,
  COALESCE(si.advance_deduction, 0) AS advance_deduction,
  COALESCE(si.adjustment, 0) AS adjustment,
  COALESCE(p.gross, 0) AS gross,
  COALESCE(p.employee_cpf, 0) AS employee_cpf,
  COALESCE(p.employer_cpf, 0) AS employer_cpf,
  COALESCE(p.sdl, 0) AS sdl,
  COALESCE(p.welfare, 0) AS welfare,
  COALESCE(p.total_deduction, 0) AS total_deduction,
  COALESCE(p.net_pay, 0) AS net_pay
FROM crews_current c  -- Changed from 'crews' to 'crews_current'
LEFT JOIN salary_items si ON c.id = si.crew_id
LEFT JOIN payslips p ON c.id = p.crew_id AND si.month = p.month;

-- Note: This is a basic template. Your actual view may have different joins or calculations.
-- Please run "SELECT pg_get_viewdef('payslip_detail_view', true);" FIRST to see your actual view,
-- then modify it by replacing "FROM crews" with "FROM crews_current"






