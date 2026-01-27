-- Supabase SQL Migration: Create User Pricing & Usage Tracking
-- Run this in your Supabase dashboard: SQL Editor → New Query

-- Create user_plans table to track user subscription status
CREATE TABLE IF NOT EXISTS user_plans (
  id BIGSERIAL PRIMARY KEY,
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
  plan_type VARCHAR(50) DEFAULT 'free',  -- 'free', 'gamer', 'wager_org'
  status VARCHAR(50) DEFAULT 'active',   -- 'active', 'paused', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  billing_period_start TIMESTAMP WITH TIME ZONE,
  billing_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE
);

-- Create daily_usage table to track free scans per user per day
CREATE TABLE IF NOT EXISTS daily_usage (
  id BIGSERIAL PRIMARY KEY,
  clerk_user_id VARCHAR(255) NOT NULL,
  usage_date DATE NOT NULL,
  analysis_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clerk_user_id, usage_date)
);

-- Create analysis_logs table for detailed tracking
CREATE TABLE IF NOT EXISTS analysis_logs (
  id BIGSERIAL PRIMARY KEY,
  clerk_user_id VARCHAR(255),
  file_name VARCHAR(255),
  file_size_mb NUMERIC,
  analysis_result TEXT,
  verdict VARCHAR(255),
  confidence INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_plans_clerk_user_id ON user_plans(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_plan_type ON user_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_daily_usage_clerk_user_id ON daily_usage(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON daily_usage(clerk_user_id, usage_date DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_logs_clerk_user_id ON analysis_logs(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_logs_created_at ON analysis_logs(created_at DESC);

-- Set up Row Level Security (RLS)
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_logs ENABLE ROW LEVEL SECURITY;

-- Create policies to allow function access
CREATE POLICY "Allow function inserts on user_plans" ON user_plans
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow function selects on user_plans" ON user_plans
  FOR SELECT USING (true);

CREATE POLICY "Allow function updates on user_plans" ON user_plans
  FOR UPDATE WITH CHECK (true);

CREATE POLICY "Allow function inserts on daily_usage" ON daily_usage
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow function selects on daily_usage" ON daily_usage
  FOR SELECT USING (true);

CREATE POLICY "Allow function updates on daily_usage" ON daily_usage
  FOR UPDATE WITH CHECK (true);

CREATE POLICY "Allow function inserts on analysis_logs" ON analysis_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow function selects on analysis_logs" ON analysis_logs
  FOR SELECT USING (true);

-- Create view for user plan details with usage stats
CREATE OR REPLACE VIEW user_plan_stats AS
SELECT 
  up.clerk_user_id,
  up.plan_type,
  up.status,
  up.created_at,
  COALESCE(du.analysis_count, 0) as today_usage,
  CASE 
    WHEN up.plan_type = 'free' THEN 1
    WHEN up.plan_type = 'gamer' THEN 50
    WHEN up.plan_type = 'wager_org' THEN 99999  -- Unlimited
    ELSE 0
  END as daily_limit,
  CASE 
    WHEN up.plan_type = 'free' AND COALESCE(du.analysis_count, 0) >= 1 THEN FALSE
    WHEN up.plan_type = 'gamer' AND COALESCE(du.analysis_count, 0) >= 50 THEN FALSE
    WHEN up.plan_type = 'wager_org' THEN TRUE
    WHEN COALESCE(du.analysis_count, 0) = 0 THEN TRUE
    ELSE TRUE
  END as can_analyze
FROM user_plans up
LEFT JOIN daily_usage du ON up.clerk_user_id = du.clerk_user_id 
  AND du.usage_date = CURRENT_DATE
ORDER BY up.created_at DESC;

-- Create view for plan analytics
CREATE OR REPLACE VIEW plan_analytics AS
SELECT 
  plan_type,
  status,
  COUNT(*) as user_count,
  COUNT(CASE WHEN du.usage_date = CURRENT_DATE THEN 1 END) as active_today,
  ROUND(AVG(COALESCE(du.analysis_count, 0))::NUMERIC, 2) as avg_daily_usage
FROM user_plans up
LEFT JOIN daily_usage du ON up.clerk_user_id = du.clerk_user_id
WHERE status = 'active'
GROUP BY plan_type, status
ORDER BY plan_type;

-- Create stored procedure for checking if user can analyze
CREATE OR REPLACE FUNCTION can_user_analyze(user_id VARCHAR(255))
RETURNS BOOLEAN AS $$
DECLARE
  plan_record user_plans%ROWTYPE;
  usage_record daily_usage%ROWTYPE;
  daily_limit INT;
BEGIN
  -- Get user's plan
  SELECT * INTO plan_record FROM user_plans 
  WHERE clerk_user_id = user_id AND status = 'active'
  LIMIT 1;

  -- If no plan found, create default free plan
  IF plan_record.id IS NULL THEN
    INSERT INTO user_plans (clerk_user_id, plan_type, status) 
    VALUES (user_id, 'free', 'active')
    ON CONFLICT (clerk_user_id) DO NOTHING
    RETURNING * INTO plan_record;
  END IF;

  -- Get today's usage
  SELECT * INTO usage_record FROM daily_usage 
  WHERE clerk_user_id = user_id AND usage_date = CURRENT_DATE
  LIMIT 1;

  -- Determine daily limit based on plan
  daily_limit := CASE 
    WHEN plan_record.plan_type = 'free' THEN 1
    WHEN plan_record.plan_type = 'gamer' THEN 50
    WHEN plan_record.plan_type = 'wager_org' THEN 99999
    ELSE 0
  END;

  -- Check if user has remaining quota
  IF COALESCE(usage_record.analysis_count, 0) < daily_limit THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE user_plans IS 'Tracks user subscription plans (free, gamer, wager_org)';
COMMENT ON TABLE daily_usage IS 'Tracks daily analysis count per user for quota enforcement';
COMMENT ON TABLE analysis_logs IS 'Detailed logs of all analysis requests';
COMMENT ON COLUMN user_plans.plan_type IS 'free=1/day, gamer=50/day, wager_org=unlimited';
COMMENT ON COLUMN user_plans.status IS 'active or cancelled';
