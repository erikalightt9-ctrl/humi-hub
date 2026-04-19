-- Add new fields to admin_vehicle_logs for fuel/maintenance log details
ALTER TABLE admin_vehicle_logs
  ADD COLUMN IF NOT EXISTS log_date        DATE,
  ADD COLUMN IF NOT EXISTS liters          DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS price_per_liter DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS total_amount    DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS last_edited_by  VARCHAR(200),
  ADD COLUMN IF NOT EXISTS last_edited_at  TIMESTAMP(3);

-- Add audit fields to admin_repair_logs
ALTER TABLE admin_repair_logs
  ADD COLUMN IF NOT EXISTS last_edited_by VARCHAR(200),
  ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP(3);
