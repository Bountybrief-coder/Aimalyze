-- Supabase SQL Migration: Create Account Tracking Table
-- Run this in your Supabase dashboard: SQL Editor → New Query
-- This migration tracks user account creation for abuse prevention

-- Create account_signups table to track account creation by IP
CREATE TABLE IF NOT EXISTS account_signups (
  id BIGSERIAL PRIMARY KEY,
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_domain VARCHAR(255),
  user_agent TEXT,
  blocked BOOLEAN DEFAULT FALSE,
  block_reason VARCHAR(255)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_account_signups_ip ON account_signups(ip_address);
CREATE INDEX IF NOT EXISTS idx_account_signups_ip_created ON account_signups(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_account_signups_email ON account_signups(email);
CREATE INDEX IF NOT EXISTS idx_account_signups_email_domain ON account_signups(email_domain);
CREATE INDEX IF NOT EXISTS idx_account_signups_created ON account_signups(created_at DESC);

-- Create temporary email domain blocklist
CREATE TABLE IF NOT EXISTS blocked_email_domains (
  id BIGSERIAL PRIMARY KEY,
  domain VARCHAR(255) UNIQUE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);

-- Pre-populate common temporary email services
INSERT INTO blocked_email_domains (domain, reason, active) VALUES
  ('mailinator.com', 'Temporary email service', TRUE),
  ('tempmail.com', 'Temporary email service', TRUE),
  ('yopmail.com', 'Temporary email service', TRUE),
  ('10minutemail.com', 'Temporary email service', TRUE),
  ('throwaway.email', 'Temporary email service', TRUE),
  ('temp-mail.org', 'Temporary email service', TRUE),
  ('trashmail.com', 'Temporary email service', TRUE),
  ('fakeinbox.com', 'Temporary email service', TRUE),
  ('sharklasers.com', 'Temporary email service', TRUE),
  ('spam4.me', 'Temporary email service', TRUE),
  ('tempmail.us', 'Temporary email service', TRUE),
  ('maildrop.cc', 'Temporary email service', TRUE)
ON CONFLICT (domain) DO NOTHING;

-- Set up Row Level Security (RLS)
ALTER TABLE account_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_email_domains ENABLE ROW LEVEL SECURITY;

-- Create policies to allow function access
CREATE POLICY "Allow function inserts on account_signups" ON account_signups
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow function updates on account_signups" ON account_signups
  FOR UPDATE WITH CHECK (true);

CREATE POLICY "Allow function selects on account_signups" ON account_signups
  FOR SELECT USING (true);

CREATE POLICY "Allow function selects on blocked_email_domains" ON blocked_email_domains
  FOR SELECT USING (true);

-- Create view for signup analytics
CREATE OR REPLACE VIEW signup_analytics AS
SELECT 
  ip_address,
  COUNT(*) as signup_count,
  COUNT(*) FILTER (WHERE blocked = TRUE) as blocked_count,
  MAX(created_at) as last_signup,
  MIN(created_at) as first_signup,
  CURRENT_TIMESTAMP - MIN(created_at) as signup_duration
FROM account_signups
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
ORDER BY signup_count DESC;

-- Create view to find suspicious IPs
CREATE OR REPLACE VIEW suspicious_ips AS
SELECT 
  ip_address,
  COUNT(*) as signup_count,
  COUNT(DISTINCT email_domain) as unique_domains,
  ARRAY_AGG(DISTINCT email_domain) as domains_used
FROM account_signups
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND blocked = FALSE
GROUP BY ip_address
HAVING COUNT(*) >= 2
ORDER BY signup_count DESC;

-- Comments for documentation
COMMENT ON TABLE account_signups IS 'Tracks user account creation by IP for signup abuse detection';
COMMENT ON TABLE blocked_email_domains IS 'List of temporary/disposable email domains to block';
COMMENT ON COLUMN account_signups.clerk_user_id IS 'Unique Clerk user ID';
COMMENT ON COLUMN account_signups.ip_address IS 'IP address of signup request';
COMMENT ON COLUMN account_signups.email IS 'Email address used for signup';
COMMENT ON COLUMN account_signups.email_domain IS 'Domain extracted from email';
COMMENT ON COLUMN account_signups.blocked IS 'Whether signup was blocked for abuse';
COMMENT ON COLUMN account_signups.block_reason IS 'Reason signup was blocked';
