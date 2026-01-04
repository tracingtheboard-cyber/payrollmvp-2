-- Add adjustment column to salary_items table
ALTER TABLE salary_items
ADD COLUMN adjustment DECIMAL(10,2) DEFAULT 0;

-- Optional: Add comment to the column (if your database supports it)
COMMENT ON COLUMN salary_items.adjustment IS 'Adjustment amount for salary calculation';

