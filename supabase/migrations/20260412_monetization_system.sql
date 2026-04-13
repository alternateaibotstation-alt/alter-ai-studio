-- Monetization and Usage Tracking System

-- Usage Records table
CREATE TABLE IF NOT EXISTS usage_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL,
  amount INT NOT NULL,
  cost DECIMAL(10, 6) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage Summary (aggregated daily)
CREATE TABLE IF NOT EXISTS usage_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  messages_used INT DEFAULT 0,
  images_used INT DEFAULT 0,
  videos_used INT DEFAULT 0,
  audio_used INT DEFAULT 0,
  tokens_used INT DEFAULT 0,
  api_calls INT DEFAULT 0,
  total_cost DECIMAL(10, 6) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Monthly Usage Summary
CREATE TABLE IF NOT EXISTS monthly_usage_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL,
  messages_used INT DEFAULT 0,
  images_used INT DEFAULT 0,
  videos_used INT DEFAULT 0,
  audio_used INT DEFAULT 0,
  tokens_used INT DEFAULT 0,
  api_calls INT DEFAULT 0,
  total_cost DECIMAL(10, 6) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

-- Plan Limits and Feature Gating
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tier VARCHAR(50) NOT NULL UNIQUE,
  monthly_limit INT,
  daily_limit INT,
  requests_per_minute INT,
  max_tokens_per_request INT,
  features JSONB DEFAULT '[]'::jsonb,
  priority_support BOOLEAN DEFAULT FALSE,
  custom_models BOOLEAN DEFAULT FALSE,
  price_monthly DECIMAL(10, 2),
  price_yearly DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Subscription
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier VARCHAR(50) DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cost Configuration
CREATE TABLE IF NOT EXISTS cost_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_type VARCHAR(50) NOT NULL UNIQUE,
  unit_cost DECIMAL(10, 8) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Billing Events
CREATE TABLE IF NOT EXISTS billing_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR(50),
  amount DECIMAL(10, 6),
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX idx_usage_records_created_at ON usage_records(created_at DESC);
CREATE INDEX idx_usage_records_resource_type ON usage_records(resource_type);
CREATE INDEX idx_usage_summary_user_id ON usage_summary(user_id);
CREATE INDEX idx_usage_summary_date ON usage_summary(date DESC);
CREATE INDEX idx_monthly_usage_user_id ON monthly_usage_summary(user_id);
CREATE INDEX idx_monthly_usage_year_month ON monthly_usage_summary(year, month DESC);
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_tier ON user_subscriptions(tier);
CREATE INDEX idx_billing_events_user_id ON billing_events(user_id);
CREATE INDEX idx_billing_events_created_at ON billing_events(created_at DESC);

-- Enable RLS
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_usage_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own usage records"
  ON usage_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own usage summary"
  ON usage_summary FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own monthly usage"
  ON monthly_usage_summary FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own billing events"
  ON billing_events FOR SELECT
  USING (auth.uid() = user_id);

-- Insert default cost configuration
INSERT INTO cost_config (resource_type, unit_cost, description)
VALUES
  ('messages', 0.0001, 'Cost per message'),
  ('images', 0.001, 'Cost per image generation'),
  ('videos', 0.01, 'Cost per video generation'),
  ('audio', 0.0005, 'Cost per audio generation'),
  ('tokens', 0.000001, 'Cost per token'),
  ('api_calls', 0.00001, 'Cost per API call')
ON CONFLICT (resource_type) DO NOTHING;

-- Insert default subscription plans
INSERT INTO subscription_plans (tier, monthly_limit, daily_limit, requests_per_minute, max_tokens_per_request, features, priority_support, custom_models, price_monthly, price_yearly)
VALUES
  ('free', 10000, 500, 10, 1000, '["basic_chat", "limited_content_generation"]'::jsonb, FALSE, FALSE, 0, 0),
  ('pro', 500000, 20000, 100, 4000, '["unlimited_chat", "content_generation", "image_generation", "batch_processing", "api_access"]'::jsonb, TRUE, FALSE, 29.99, 299.99),
  ('power', NULL, NULL, 1000, 8000, '["unlimited_everything", "video_generation", "audio_generation", "custom_models", "webhook_integration", "advanced_analytics"]'::jsonb, TRUE, TRUE, 99.99, 999.99),
  ('enterprise', NULL, NULL, NULL, 16000, '["everything", "dedicated_support", "custom_integration", "sso", "advanced_security"]'::jsonb, TRUE, TRUE, NULL, NULL)
ON CONFLICT (tier) DO NOTHING;

-- Function to record usage
CREATE OR REPLACE FUNCTION record_usage(
  p_user_id UUID,
  p_resource_type VARCHAR,
  p_amount INT,
  p_cost DECIMAL DEFAULT 0
)
RETURNS void AS $$
BEGIN
  INSERT INTO usage_records (user_id, resource_type, amount, cost)
  VALUES (p_user_id, p_resource_type, p_amount, p_cost);

  -- Update daily summary
  INSERT INTO usage_summary (user_id, date)
  VALUES (p_user_id, CURRENT_DATE)
  ON CONFLICT (user_id, date) DO NOTHING;

  -- Update the specific resource in daily summary
  CASE p_resource_type
    WHEN 'messages' THEN
      UPDATE usage_summary
      SET messages_used = messages_used + p_amount, total_cost = total_cost + p_cost
      WHERE user_id = p_user_id AND date = CURRENT_DATE;
    WHEN 'images' THEN
      UPDATE usage_summary
      SET images_used = images_used + p_amount, total_cost = total_cost + p_cost
      WHERE user_id = p_user_id AND date = CURRENT_DATE;
    WHEN 'videos' THEN
      UPDATE usage_summary
      SET videos_used = videos_used + p_amount, total_cost = total_cost + p_cost
      WHERE user_id = p_user_id AND date = CURRENT_DATE;
    WHEN 'audio' THEN
      UPDATE usage_summary
      SET audio_used = audio_used + p_amount, total_cost = total_cost + p_cost
      WHERE user_id = p_user_id AND date = CURRENT_DATE;
    WHEN 'tokens' THEN
      UPDATE usage_summary
      SET tokens_used = tokens_used + p_amount, total_cost = total_cost + p_cost
      WHERE user_id = p_user_id AND date = CURRENT_DATE;
    WHEN 'api_calls' THEN
      UPDATE usage_summary
      SET api_calls = api_calls + p_amount, total_cost = total_cost + p_cost
      WHERE user_id = p_user_id AND date = CURRENT_DATE;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user usage stats
CREATE OR REPLACE FUNCTION get_user_usage_stats(p_user_id UUID)
RETURNS TABLE (
  tier VARCHAR,
  monthly_tokens INT,
  monthly_cost DECIMAL,
  daily_tokens INT,
  daily_cost DECIMAL,
  percentage_used DECIMAL
) AS $$
DECLARE
  v_tier VARCHAR;
  v_monthly_limit INT;
  v_monthly_tokens INT;
  v_monthly_cost DECIMAL;
  v_daily_tokens INT;
  v_daily_cost DECIMAL;
BEGIN
  -- Get user tier
  SELECT us.tier INTO v_tier
  FROM user_subscriptions us
  WHERE us.user_id = p_user_id;

  IF v_tier IS NULL THEN
    v_tier := 'free';
  END IF;

  -- Get plan limits
  SELECT monthly_limit INTO v_monthly_limit
  FROM subscription_plans
  WHERE tier = v_tier;

  -- Get monthly usage
  SELECT COALESCE(SUM(tokens_used), 0), COALESCE(SUM(total_cost), 0)
  INTO v_monthly_tokens, v_monthly_cost
  FROM monthly_usage_summary
  WHERE user_id = p_user_id
    AND year = EXTRACT(YEAR FROM CURRENT_DATE)
    AND month = EXTRACT(MONTH FROM CURRENT_DATE);

  -- Get daily usage
  SELECT COALESCE(tokens_used, 0), COALESCE(total_cost, 0)
  INTO v_daily_tokens, v_daily_cost
  FROM usage_summary
  WHERE user_id = p_user_id AND date = CURRENT_DATE;

  RETURN QUERY SELECT
    v_tier,
    v_monthly_tokens,
    v_monthly_cost,
    v_daily_tokens,
    v_daily_cost,
    CASE WHEN v_monthly_limit IS NOT NULL THEN (v_monthly_tokens::DECIMAL / v_monthly_limit * 100) ELSE 0 END;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can perform action
CREATE OR REPLACE FUNCTION can_perform_action(
  p_user_id UUID,
  p_resource_type VARCHAR,
  p_amount INT DEFAULT 1
)
RETURNS TABLE (
  allowed BOOLEAN,
  reason VARCHAR
) AS $$
DECLARE
  v_tier VARCHAR;
  v_monthly_limit INT;
  v_daily_limit INT;
  v_monthly_usage INT;
  v_daily_usage INT;
BEGIN
  -- Get user tier
  SELECT us.tier INTO v_tier
  FROM user_subscriptions us
  WHERE us.user_id = p_user_id;

  IF v_tier IS NULL THEN
    v_tier := 'free';
  END IF;

  -- Get plan limits
  SELECT monthly_limit, daily_limit INTO v_monthly_limit, v_daily_limit
  FROM subscription_plans
  WHERE tier = v_tier;

  -- Get monthly usage
  SELECT COALESCE(tokens_used, 0) INTO v_monthly_usage
  FROM monthly_usage_summary
  WHERE user_id = p_user_id
    AND year = EXTRACT(YEAR FROM CURRENT_DATE)
    AND month = EXTRACT(MONTH FROM CURRENT_DATE);

  -- Get daily usage
  SELECT COALESCE(tokens_used, 0) INTO v_daily_usage
  FROM usage_summary
  WHERE user_id = p_user_id AND date = CURRENT_DATE;

  -- Check limits
  IF v_monthly_limit IS NOT NULL AND v_monthly_usage + p_amount > v_monthly_limit THEN
    RETURN QUERY SELECT FALSE, 'Monthly limit exceeded'::VARCHAR;
  ELSIF v_daily_limit IS NOT NULL AND v_daily_usage + p_amount > v_daily_limit THEN
    RETURN QUERY SELECT FALSE, 'Daily limit exceeded'::VARCHAR;
  ELSE
    RETURN QUERY SELECT TRUE, NULL::VARCHAR;
  END IF;
END;
$$ LANGUAGE plpgsql;
