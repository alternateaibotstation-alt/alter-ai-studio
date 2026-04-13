-- AI Engine Core Tables

-- AI Requests Log (for usage tracking and analytics)
CREATE TABLE IF NOT EXISTS ai_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  task_type VARCHAR(50) DEFAULT 'chat',
  model_used VARCHAR(100),
  complexity_level VARCHAR(20),
  tier VARCHAR(20),
  tokens_used INT DEFAULT 0,
  cost DECIMAL(10, 6) DEFAULT 0,
  response_time_ms INT,
  status VARCHAR(20) DEFAULT 'completed',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Prompt Templates
CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  system_prompt TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  output_format VARCHAR(50) DEFAULT 'text',
  examples JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT FALSE,
  use_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bot Personas (enhanced)
CREATE TABLE IF NOT EXISTS bot_personas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  tone VARCHAR(50),
  expertise JSONB DEFAULT '[]'::jsonb,
  constraints JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversation Memory (for persistent context)
CREATE TABLE IF NOT EXISTS conversation_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  message_index INT NOT NULL,
  role VARCHAR(20),
  content TEXT NOT NULL,
  tokens_used INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Model Performance Metrics
CREATE TABLE IF NOT EXISTS model_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  total_requests INT DEFAULT 0,
  avg_response_time_ms INT DEFAULT 0,
  avg_tokens_used INT DEFAULT 0,
  error_rate DECIMAL(5, 2) DEFAULT 0,
  cost_per_request DECIMAL(10, 6) DEFAULT 0,
  quality_score DECIMAL(3, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(model_name, date)
);

-- Content Generation History
CREATE TABLE IF NOT EXISTS content_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  generated_content TEXT NOT NULL,
  platforms JSONB DEFAULT '[]'::jsonb,
  output_format VARCHAR(50),
  model_used VARCHAR(100),
  tokens_used INT DEFAULT 0,
  cost DECIMAL(10, 6) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage Tracking (aggregated)
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  requests_count INT DEFAULT 0,
  tokens_used INT DEFAULT 0,
  cost_incurred DECIMAL(10, 6) DEFAULT 0,
  content_generated INT DEFAULT 0,
  images_generated INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create indexes for performance
CREATE INDEX idx_ai_requests_user_id ON ai_requests(user_id);
CREATE INDEX idx_ai_requests_bot_id ON ai_requests(bot_id);
CREATE INDEX idx_ai_requests_created_at ON ai_requests(created_at);
CREATE INDEX idx_conversation_memory_user_bot ON conversation_memory(user_id, bot_id);
CREATE INDEX idx_conversation_memory_conversation_id ON conversation_memory(conversation_id);
CREATE INDEX idx_content_generations_user_id ON content_generations(user_id);
CREATE INDEX idx_usage_tracking_user_date ON usage_tracking(user_id, date);

-- Enable RLS (Row Level Security)
ALTER TABLE ai_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own AI requests"
  ON ai_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own prompt templates"
  ON prompt_templates FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create prompt templates"
  ON prompt_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own conversation memory"
  ON conversation_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own content generations"
  ON content_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own usage tracking"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

-- Function to get or reset daily usage
CREATE OR REPLACE FUNCTION get_or_reset_usage(p_user_id UUID)
RETURNS TABLE (
  requests_count INT,
  tokens_used INT,
  cost_incurred DECIMAL,
  content_generated INT,
  images_generated INT
) AS $$
BEGIN
  INSERT INTO usage_tracking (user_id, date, requests_count, tokens_used, cost_incurred)
  VALUES (p_user_id, CURRENT_DATE, 0, 0, 0)
  ON CONFLICT (user_id, date) DO NOTHING;

  RETURN QUERY
  SELECT
    ut.requests_count,
    ut.tokens_used,
    ut.cost_incurred,
    ut.content_generated,
    ut.images_generated
  FROM usage_tracking ut
  WHERE ut.user_id = p_user_id AND ut.date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_tokens INT DEFAULT 0,
  p_cost DECIMAL DEFAULT 0,
  p_content_count INT DEFAULT 0,
  p_images_count INT DEFAULT 0
)
RETURNS void AS $$
BEGIN
  INSERT INTO usage_tracking (
    user_id,
    date,
    requests_count,
    tokens_used,
    cost_incurred,
    content_generated,
    images_generated
  )
  VALUES (p_user_id, CURRENT_DATE, 1, p_tokens, p_cost, p_content_count, p_images_count)
  ON CONFLICT (user_id, date) DO UPDATE SET
    requests_count = usage_tracking.requests_count + 1,
    tokens_used = usage_tracking.tokens_used + p_tokens,
    cost_incurred = usage_tracking.cost_incurred + p_cost,
    content_generated = usage_tracking.content_generated + p_content_count,
    images_generated = usage_tracking.images_generated + p_images_count;
END;
$$ LANGUAGE plpgsql;
