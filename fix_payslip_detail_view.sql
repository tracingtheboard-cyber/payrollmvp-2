-- Step 1: View the current payslip_detail_view definition
-- Run this first to see what the view currently looks like:
-- SELECT pg_get_viewdef('payslip_detail_view', true);

-- Step 2: Drop the existing view
DROP VIEW IF EXISTS payslip_detail_view CASCADE;

-- Step 3: Recreate the view using crew_compensation instead of crews.basic_salary
-- IMPORTANT: You need to adjust this based on your actual view definition!
-- This is a template - replace the SELECT statement with your actual view logic

CREATE OR REPLACE VIEW payslip_detail_view AS
SELECT 
  c.id AS crew_id,
  c.name,
  si.month,
  COALESCE(cc.basic_salary, 0) AS basic_salary,  -- Changed from c.basic_salary to cc.basic_salary
  COALESCE(si.allowance, 0) AS allowance,
  COALESCE(si.overtime, 0) AS overtime,
  COALESCE(si.bonus, 0) AS bonus,
  COALESCE(si.unutilised_leave_pay, 0) AS unutilised_leave_pay,
  COALESCE(si.unpaid_leave_deduction, 0) AS unpaid_leave_deduction,
  COALESCE(si.advance_deduction, 0) AS advance_deduction,
  COALESCE(si.adjustment, 0) AS adjustment,
  -- Gross calculation (adjust as needed)
  COALESCE(cc.basic_salary, 0) + 
  COALESCE(si.allowance, 0) + 
  COALESCE(si.overtime, 0) + 
  COALESCE(si.bonus, 0) + 
  COALESCE(si.unutilised_leave_pay, 0) - 
  COALESCE(si.unpaid_leave_deduction, 0) - 
  COALESCE(si.advance_deduction, 0) + 
  COALESCE(si.adjustment, 0) AS gross,
  -- Add other fields from your payroll calculation
  -- These typically come from payslips table or calculated fields
  0 AS employee_cpf,
  0 AS employer_cpf,
  0 AS sdl,
  0 AS welfare,
  0 AS total_deduction,
  0 AS net_pay
FROM crews c
LEFT JOIN crew_compensation cc ON c.id = cc.crew_id AND cc.is_active = true
LEFT JOIN salary_items si ON c.id = si.crew_id;

-- Note: If your view includes joins with payslips table or other tables,
-- you need to add those joins above. This is just a basic template.

-- If the error persists, check your database functions (run_payroll, run_payroll_preview)
-- as they may also reference crews.basic_salary

