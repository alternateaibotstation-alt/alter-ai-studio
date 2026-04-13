-- Viral Loop & Distribution System

-- Shareable Outputs
CREATE TABLE IF NOT EXISTS shareable_outputs (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id VARCHAR(255),
  content_type VARCHAR(50),
  content TEXT,
  watermark VARCHAR(255),
  share_url TEXT,
  affiliate_code VARCHAR(255),
  views INT DEFAULT 0,
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Affiliate Links
CREATE TABLE IF NOT EXISTS affiliate_links (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code VARCHAR(255) UNIQUE,
  affiliate_type VARCHAR(50),
  target_id VARCHAR(255),
  target_url TEXT,
  commission DECIMAL(5, 2),
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  revenue DECIMAL(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Affiliate Conversions
CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_code VARCHAR(255),
  user_id UUID REFERENCES auth.users(id),
  sale_amount DECIMAL(10, 2),
  commission DECIMAL(10, 2),
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Referral Programs
CREATE TABLE IF NOT EXISTS referral_programs (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  referral_code VARCHAR(255) UNIQUE,
  referral_url TEXT,
  referrals_count INT DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0,
  total_reward DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Referral Conversions
CREATE TABLE IF NOT EXISTS referral_conversions (
  id VARCHAR(255) PRIMARY KEY,
  referral_code VARCHAR(255),
  referrer_id UUID REFERENCES auth.users(id),
  referee_id UUID REFERENCES auth.users(id),
  reward_amount DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Creator Profiles
CREATE TABLE IF NOT EXISTS creator_profiles (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  username VARCHAR(255) UNIQUE,
  bio TEXT,
  avatar TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  followers INT DEFAULT 0,
  templates INT DEFAULT 0,
  earnings DECIMAL(10, 2) DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_shareable_outputs_user_id ON shareable_outputs(user_id);
CREATE INDEX idx_shareable_outputs_affiliate_code ON shareable_outputs(affiliate_code);
CREATE INDEX idx_shareable_outputs_created_at ON shareable_outputs(created_at DESC);
CREATE INDEX idx_affiliate_links_user_id ON affiliate_links(user_id);
CREATE INDEX idx_affiliate_links_code ON affiliate_links(affiliate_code);
CREATE INDEX idx_affiliate_conversions_code ON affiliate_conversions(affiliate_code);
CREATE INDEX idx_referral_programs_user_id ON referral_programs(user_id);
CREATE INDEX idx_referral_programs_code ON referral_programs(referral_code);
CREATE INDEX idx_referral_conversions_code ON referral_conversions(referral_code);
CREATE INDEX idx_creator_profiles_user_id ON creator_profiles(user_id);
CREATE INDEX idx_creator_profiles_username ON creator_profiles(username);

-- Enable RLS
ALTER TABLE shareable_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view shareable outputs"
  ON shareable_outputs FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can view affiliate links"
  ON affiliate_links FOR SELECT
  USING (user_id = auth.uid() OR TRUE);

CREATE POLICY "Users can view their referral program"
  ON referral_programs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view creator profiles"
  ON creator_profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can update their own profile"
  ON creator_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Function to increment share views
CREATE OR REPLACE FUNCTION increment_share_views(p_output_id VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE shareable_outputs
  SET views = views + 1
  WHERE id = p_output_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment affiliate clicks
CREATE OR REPLACE FUNCTION increment_affiliate_clicks(p_affiliate_code VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE affiliate_links
  SET clicks = clicks + 1
  WHERE affiliate_code = p_affiliate_code;
END;
$$ LANGUAGE plpgsql;

-- Function to increment referral count
CREATE OR REPLACE FUNCTION increment_referral_count(
  p_referral_code VARCHAR,
  p_reward_amount DECIMAL
)
RETURNS void AS $$
BEGIN
  UPDATE referral_programs
  SET
    referrals_count = referrals_count + 1,
    total_reward = total_reward + p_reward_amount
  WHERE referral_code = p_referral_code;
END;
$$ LANGUAGE plpgsql;

-- Function to get viral metrics
CREATE OR REPLACE FUNCTION get_viral_metrics(p_user_id UUID)
RETURNS TABLE (
  total_shares INT,
  total_views INT,
  total_clicks INT,
  total_conversions INT,
  avg_ctr DECIMAL,
  affiliate_revenue DECIMAL,
  referral_revenue DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT so.id)::INT as total_shares,
    COALESCE(SUM(so.views), 0)::INT as total_views,
    COALESCE(SUM(so.clicks), 0)::INT as total_clicks,
    COALESCE(SUM(so.conversions), 0)::INT as total_conversions,
    CASE WHEN SUM(so.views) > 0 THEN (SUM(so.clicks)::DECIMAL / SUM(so.views) * 100) ELSE 0 END as avg_ctr,
    COALESCE(SUM(al.revenue), 0)::DECIMAL as affiliate_revenue,
    COALESCE(rp.total_reward, 0)::DECIMAL as referral_revenue
  FROM shareable_outputs so
  LEFT JOIN affiliate_links al ON so.user_id = al.user_id
  LEFT JOIN referral_programs rp ON so.user_id = rp.user_id
  WHERE so.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get top shareable content
CREATE OR REPLACE FUNCTION get_top_shareable_content(p_limit INT DEFAULT 10)
RETURNS TABLE (
  id VARCHAR,
  user_id UUID,
  views INT,
  clicks INT,
  conversions INT,
  ctr DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    so.id,
    so.user_id,
    so.views,
    so.clicks,
    so.conversions,
    CASE WHEN so.views > 0 THEN (so.clicks::DECIMAL / so.views * 100) ELSE 0 END as ctr
  FROM shareable_outputs so
  ORDER BY so.views DESC, so.conversions DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
