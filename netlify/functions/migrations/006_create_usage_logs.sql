-- Migration: Create usage_logs table for all scan attempts
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  ip_address TEXT,
  video_type TEXT NOT NULL, -- 'upload' or 'youtube'
  success BOOLEAN NOT NULL,
  verdict TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_ip_address ON usage_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON usage_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_usage_logs_verdict ON usage_logs(verdict);

ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
