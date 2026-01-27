-- Supabase SQL Migration: Create IP Logs Table
-- Run this in your Supabase dashboard: SQL Editor → New Query

-- Create ip_logs table for rate limiting and abuse detection
CREATE TABLE IF NOT EXISTS ip_logs (
  id BIGSERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,  -- Supports both IPv4 and IPv6
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  endpoint VARCHAR(255) DEFAULT '/analyze',
  status_code INT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_ip_logs_ip_address ON ip_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_logs_timestamp ON ip_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ip_logs_ip_timestamp ON ip_logs(ip_address, timestamp DESC);

-- Set up Row Level Security (RLS) - disable for now since functions need access
ALTER TABLE ip_logs ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow the functions to insert logs
CREATE POLICY "Allow function inserts" ON ip_logs
  FOR INSERT WITH CHECK (true);

-- Optional: Create a view for analytics
CREATE OR REPLACE VIEW ip_logs_summary AS
SELECT 
  ip_address,
  COUNT(*) as request_count,
  COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
  MAX(timestamp) as last_request,
  MIN(timestamp) as first_request,
  CURRENT_TIMESTAMP - MIN(timestamp) as active_duration
FROM ip_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
ORDER BY request_count DESC;

-- Comment on table for documentation
COMMENT ON TABLE ip_logs IS 'Logs of API requests by IP address for rate limiting and abuse detection';
COMMENT ON COLUMN ip_logs.ip_address IS 'Client IP address (IPv4 or IPv6)';
COMMENT ON COLUMN ip_logs.timestamp IS 'When the request was made';
COMMENT ON COLUMN ip_logs.user_agent IS 'User agent string from request headers';
COMMENT ON COLUMN ip_logs.endpoint IS 'API endpoint that was called';
COMMENT ON COLUMN ip_logs.status_code IS 'HTTP response status code';
