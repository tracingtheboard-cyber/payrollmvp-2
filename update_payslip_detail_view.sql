-- Update payslip_detail_view to use crew_compensation instead of crews.basic_salary
-- First, drop the existing view
DROP VIEW IF EXISTS payslip_detail_view CASCADE;

-- Recreate the view with the new structure
-- Note: This is a template - you may need to adjust based on your actual view definition
CREATE OR REPLACE VIEW payslip_detail_view AS
SELECT 
  c.id AS crew_id,
  c.name,
  si.month,
  COALESCE(cc.basic_salary, 0) AS basic_salary,
  COALESCE(si.allowance, 0) AS allowance,
  COALESCE(si.overtime, 0) AS overtime,
  COALESCE(si.bonus, 0) AS bonus,
  COALESCE(si.unutilised_leave_pay, 0) AS unutilised_leave_pay,
  COALESCE(si.unpaid_leave_deduction, 0) AS unpaid_leave_deduction,
  COALESCE(si.advance_deduction, 0) AS advance_deduction,
  COALESCE(si.adjustment, 0) AS adjustment,
  -- Calculate gross (you may need to adjust this calculation)
  COALESCE(cc.basic_salary, 0) + 
  COALESCE(si.allowance, 0) + 
  COALESCE(si.overtime, 0) + 
  COALESCE(si.bonus, 0) + 
  COALESCE(si.unutilised_leave_pay, 0) - 
  COALESCE(si.unpaid_leave_deduction, 0) - 
  COALESCE(si.advance_deduction, 0) + 
  COALESCE(si.adjustment, 0) AS gross,
  -- Add other calculated fields as needed (CPF, SDL, etc.)
  -- These would typically come from your payroll calculation functions
  0 AS employee_cpf,
  0 AS employer_cpf,
  0 AS sdl,
  0 AS welfare,
  0 AS total_deduction,
  0 AS net_pay
FROM crews c
LEFT JOIN crew_compensation cc ON c.id = cc.crew_id AND cc.is_active = true
LEFT JOIN salary_items si ON c.id = si.crew_id;

-- Note: If your payslip_detail_view has more complex calculations or joins,
-- you may need to adjust this SQL accordingly. 
-- Check your original view definition and update the SELECT statement above.

