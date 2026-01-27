-- Migration: Create user_plans table for paid access enforcement
CREATE TABLE IF NOT EXISTS user_plans (
  user_id TEXT PRIMARY KEY,
  plan_type TEXT NOT NULL DEFAULT 'free', -- 'free', 'monthly', 'lifetime'
  stripe_customer_id TEXT,
  last_scan_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_user_plans_plan_type ON user_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_user_plans_last_scan_at ON user_plans(last_scan_at);

ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
