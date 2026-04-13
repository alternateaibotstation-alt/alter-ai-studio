-- Onboarding Funnel System

-- Onboarding Flows
CREATE TABLE IF NOT EXISTS onboarding_flows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_step VARCHAR(50) DEFAULT 'welcome',
  status VARCHAR(50) DEFAULT 'in_progress',
  completed_steps TEXT[] DEFAULT ARRAY[]::TEXT[],
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  time_to_complete INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Onboarding Metrics
CREATE TABLE IF NOT EXISTS onboarding_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  step VARCHAR(50),
  time_spent INT,
  completed BOOLEAN DEFAULT FALSE,
  skipped BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quick Win Templates
CREATE TABLE IF NOT EXISTS quick_win_templates (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  prompt TEXT,
  expected_output TEXT,
  estimated_time INT,
  difficulty VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Onboarding Conversions (tracks conversions from onboarding)
CREATE TABLE IF NOT EXISTS onboarding_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  step VARCHAR(50),
  action VARCHAR(100),
  value DECIMAL(10, 2),
  converted_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_onboarding_flows_user_id ON onboarding_flows(user_id);
CREATE INDEX idx_onboarding_flows_status ON onboarding_flows(status);
CREATE INDEX idx_onboarding_flows_created_at ON onboarding_flows(created_at DESC);
CREATE INDEX idx_onboarding_metrics_user_id ON onboarding_metrics(user_id);
CREATE INDEX idx_onboarding_metrics_step ON onboarding_metrics(step);
CREATE INDEX idx_onboarding_conversions_user_id ON onboarding_conversions(user_id);

-- Enable RLS
ALTER TABLE onboarding_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_conversions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own onboarding flow"
  ON onboarding_flows FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their own metrics"
  ON onboarding_metrics FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their own conversions"
  ON onboarding_conversions FOR SELECT
  USING (user_id = auth.uid());

-- Insert default quick win templates
INSERT INTO quick_win_templates (id, name, description, category, prompt, expected_output, estimated_time, difficulty)
VALUES
  ('qw_twitter_hook', 'Twitter Hook Generator', 'Generate a viral Twitter hook in 30 seconds', 'social', 'Generate a catchy, viral Twitter hook about [TOPIC] that gets engagement. Make it punchy and under 280 characters.', 'A single compelling Twitter hook', 10, 'easy'),
  ('qw_email_subject', 'Email Subject Line', 'Create a high-converting email subject line', 'email', 'Generate 3 high-converting email subject lines for [TOPIC]. Make them curiosity-driven and compelling.', '3 email subject line options', 15, 'easy'),
  ('qw_linkedin_post', 'LinkedIn Post', 'Write a professional LinkedIn post', 'social', 'Write a professional LinkedIn post about [TOPIC] that drives engagement. Include a call-to-action.', 'A complete LinkedIn post', 20, 'easy'),
  ('qw_product_description', 'Product Description', 'Generate a compelling product description', 'sales', 'Write a compelling product description for [TOPIC]. Focus on benefits, not features. Include a call-to-action.', 'A product description (100-150 words)', 25, 'medium'),
  ('qw_blog_intro', 'Blog Post Introduction', 'Write an engaging blog post intro', 'content', 'Write an engaging introduction for a blog post about [TOPIC]. Hook the reader in the first 2 sentences.', 'A blog post introduction (50-100 words)', 20, 'medium'),
  ('qw_sales_email', 'Sales Email Copy', 'Create a sales email template', 'email', 'Write a persuasive sales email for [TOPIC]. Include: subject line, greeting, hook, value proposition, CTA.', 'A complete sales email', 30, 'medium')
ON CONFLICT (id) DO NOTHING;

-- Function to get onboarding stats
CREATE OR REPLACE FUNCTION get_onboarding_stats()
RETURNS TABLE (
  total_users INT,
  completed_users INT,
  in_progress_users INT,
  completion_rate DECIMAL,
  avg_time_to_complete INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT of.user_id)::INT as total_users,
    COUNT(DISTINCT CASE WHEN of.status = 'completed' THEN of.user_id END)::INT as completed_users,
    COUNT(DISTINCT CASE WHEN of.status = 'in_progress' THEN of.user_id END)::INT as in_progress_users,
    (COUNT(DISTINCT CASE WHEN of.status = 'completed' THEN of.user_id END)::DECIMAL / COUNT(DISTINCT of.user_id) * 100)::DECIMAL as completion_rate,
    COALESCE(AVG(of.time_to_complete), 0)::INT as avg_time_to_complete
  FROM onboarding_flows of;
END;
$$ LANGUAGE plpgsql;

-- Function to get drop-off by step
CREATE OR REPLACE FUNCTION get_dropoff_by_step()
RETURNS TABLE (
  step VARCHAR,
  total_users INT,
  completed_users INT,
  dropoff_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    om.step,
    COUNT(DISTINCT om.user_id)::INT as total_users,
    COUNT(DISTINCT CASE WHEN om.completed THEN om.user_id END)::INT as completed_users,
    ((COUNT(DISTINCT om.user_id) - COUNT(DISTINCT CASE WHEN om.completed THEN om.user_id END))::DECIMAL / COUNT(DISTINCT om.user_id) * 100)::DECIMAL as dropoff_rate
  FROM onboarding_metrics om
  GROUP BY om.step
  ORDER BY om.step;
END;
$$ LANGUAGE plpgsql;

-- Function to get first content generation rate
CREATE OR REPLACE FUNCTION get_first_content_generation_rate()
RETURNS TABLE (
  total_onboarded INT,
  generated_content INT,
  generation_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT of.user_id)::INT as total_onboarded,
    COUNT(DISTINCT CASE WHEN om.step = 'first_generation' AND om.completed THEN om.user_id END)::INT as generated_content,
    (COUNT(DISTINCT CASE WHEN om.step = 'first_generation' AND om.completed THEN om.user_id END)::DECIMAL / COUNT(DISTINCT of.user_id) * 100)::DECIMAL as generation_rate
  FROM onboarding_flows of
  LEFT JOIN onboarding_metrics om ON of.user_id = om.user_id;
END;
$$ LANGUAGE plpgsql;
