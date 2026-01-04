-- Update Database Views and Functions to use crews_current instead of crews
-- This ensures basic_salary is read from crew_compensation transparently

-- ============================================================================
-- STEP 1: View Current Definitions
-- ============================================================================

-- View the current payslip_detail_view definition:
-- SELECT pg_get_viewdef('payslip_detail_view', true);

-- View the current run_payroll function definition:
-- SELECT pg_get_functiondef('run_payroll'::regproc);

-- View the current run_payroll_preview function definition:
-- SELECT pg_get_functiondef('run_payroll_preview'::regproc);

-- ============================================================================
-- STEP 2: Update payslip_detail_view
-- ============================================================================

-- Drop the existing view
DROP VIEW IF EXISTS payslip_detail_view CASCADE;

-- Recreate the view using crews_current
-- IMPORTANT: Copy your actual view definition from STEP 1 and replace:
--   - "FROM crews" or "FROM crews c" → "FROM crews_current c"
--   - Keep all other logic the same
--   - c.basic_salary will now automatically read from crew_compensation

-- Example template (replace with your actual view definition):
CREATE OR REPLACE VIEW payslip_detail_view AS
SELECT 
  c.id AS crew_id,
  c.name,
  si.month,
  c.basic_salary,  -- This now reads from crew_compensation via crews_current
  COALESCE(si.allowance, 0) AS allowance,
  COALESCE(si.overtime, 0) AS overtime,
  COALESCE(si.bonus, 0) AS bonus,
  COALESCE(si.unutilised_leave_pay, 0) AS unutilised_leave_pay,
  COALESCE(si.unpaid_leave_deduction, 0) AS unpaid_leave_deduction,
  COALESCE(si.advance_deduction, 0) AS advance_deduction,
  COALESCE(si.adjustment, 0) AS adjustment,
  -- Add other fields as needed (gross, employee_cpf, employer_cpf, sdl, welfare, total_deduction, net_pay)
  -- Keep your existing calculation logic from the original view
FROM crews_current c  -- Changed from 'crews' to 'crews_current'
LEFT JOIN salary_items si ON c.id = si.crew_id;
-- Add other joins as needed (e.g., payslips table)

-- ============================================================================
-- STEP 3: Update run_payroll function
-- ============================================================================

-- Drop the existing function
DROP FUNCTION IF EXISTS run_payroll(text);

-- Recreate the function using crews_current
-- IMPORTANT: Copy your actual function definition from STEP 1 and replace:
--   - "FROM crews" or "FROM crews c" → "FROM crews_current c"
--   - All references to c.basic_salary will now work correctly
--   - Keep all other logic the same

-- Example template (replace with your actual function definition):
CREATE OR REPLACE FUNCTION run_payroll(target_month text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Your function logic here
  -- Replace "FROM crews" with "FROM crews_current"
  -- Example:
  -- INSERT INTO payslips (crew_id, month, basic_salary, ...)
  -- SELECT c.id, target_month, c.basic_salary, ...
  -- FROM crews_current c  -- Changed from 'crews' to 'crews_current'
  -- WHERE ...;
END;
$$;

-- ============================================================================
-- STEP 4: Update run_payroll_preview function
-- ============================================================================

-- Drop the existing function
DROP FUNCTION IF EXISTS run_payroll_preview(uuid, text);

-- Recreate the function using crews_current
-- IMPORTANT: Copy your actual function definition from STEP 1 and replace:
--   - "FROM crews" or "FROM crews c" → "FROM crews_current c"
--   - All references to c.basic_salary will now work correctly
--   - Keep all other logic the same

-- Example template (replace with your actual function definition):
CREATE OR REPLACE FUNCTION run_payroll_preview(p_crew_id uuid, p_month text)
RETURNS TABLE (
  gross numeric,
  employee_cpf numeric,
  net_pay numeric
  -- Add other return columns as needed
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Your calculation logic here
    -- Use c.basic_salary from crews_current
  FROM crews_current c  -- Changed from 'crews' to 'crews_current'
  WHERE c.id = p_crew_id;
END;
$$;

-- ============================================================================
-- STEP 5: Check for other database objects
-- ============================================================================

-- Find all views that reference crews table:
-- SELECT schemaname, viewname, definition
-- FROM pg_views
-- WHERE definition LIKE '%crews%'
-- AND schemaname = 'public';

-- Find all functions that reference crews table:
-- SELECT p.proname, pg_get_functiondef(p.oid)
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
-- AND pg_get_functiondef(p.oid) LIKE '%crews%';

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
-- 
-- For each database object (view, function, trigger, etc.):
-- 1. Get the current definition using pg_get_viewdef() or pg_get_functiondef()
-- 2. Copy the definition
-- 3. Replace "FROM crews" or "FROM crews c" with "FROM crews_current c"
-- 4. Keep the alias 'c' the same
-- 5. All references to c.basic_salary will now automatically read from crew_compensation
-- 6. Drop and recreate the object with the updated definition
--
-- No need to change field names or frontend logic!

