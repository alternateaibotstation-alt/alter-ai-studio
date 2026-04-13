-- Template Marketplace System

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id VARCHAR(255) PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  thumbnail TEXT,
  content JSONB NOT NULL,
  version VARCHAR(20) DEFAULT '1.0.0',
  status VARCHAR(50) DEFAULT 'pending_review',
  price DECIMAL(10, 2) DEFAULT 0,
  license_type VARCHAR(50) DEFAULT 'personal',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INT DEFAULT 0,
  download_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

-- Template Versions
CREATE TABLE IF NOT EXISTS template_versions (
  id VARCHAR(255) PRIMARY KEY,
  template_id VARCHAR(255) REFERENCES templates(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  content JSONB NOT NULL,
  changelog TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(template_id, version)
);

-- Template Reviews
CREATE TABLE IF NOT EXISTS template_reviews (
  id VARCHAR(255) PRIMARY KEY,
  template_id VARCHAR(255) REFERENCES templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  helpful INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Template Licenses
CREATE TABLE IF NOT EXISTS template_licenses (
  id VARCHAR(255) PRIMARY KEY,
  template_id VARCHAR(255) REFERENCES templates(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  license_type VARCHAR(50) NOT NULL,
  purchase_price DECIMAL(10, 2),
  purchased_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Template Revenue Splits
CREATE TABLE IF NOT EXISTS template_revenue_splits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id VARCHAR(255) REFERENCES templates(id) ON DELETE CASCADE,
  creator_share DECIMAL(5, 2),
  platform_share DECIMAL(5, 2),
  affiliate_share DECIMAL(5, 2),
  sale_amount DECIMAL(10, 2),
  creator_earnings DECIMAL(10, 2),
  platform_earnings DECIMAL(10, 2),
  affiliate_earnings DECIMAL(10, 2),
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Creator Earnings
CREATE TABLE IF NOT EXISTS creator_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id VARCHAR(255) REFERENCES templates(id),
  amount DECIMAL(10, 2),
  period_start DATE,
  period_end DATE,
  status VARCHAR(50) DEFAULT 'pending',
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_templates_creator_id ON templates(creator_id);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_status ON templates(status);
CREATE INDEX idx_templates_rating ON templates(rating DESC);
CREATE INDEX idx_templates_created_at ON templates(created_at DESC);
CREATE INDEX idx_template_versions_template_id ON template_versions(template_id);
CREATE INDEX idx_template_reviews_template_id ON template_reviews(template_id);
CREATE INDEX idx_template_reviews_user_id ON template_reviews(user_id);
CREATE INDEX idx_template_licenses_buyer_id ON template_licenses(buyer_id);
CREATE INDEX idx_template_licenses_template_id ON template_licenses(template_id);
CREATE INDEX idx_creator_earnings_creator_id ON creator_earnings(creator_id);

-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view published templates"
  ON templates FOR SELECT
  USING (status = 'published' OR creator_id = auth.uid());

CREATE POLICY "Creators can manage their own templates"
  ON templates FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete their own templates"
  ON templates FOR DELETE
  USING (creator_id = auth.uid());

CREATE POLICY "Users can view template versions"
  ON template_versions FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can view template reviews"
  ON template_reviews FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can create reviews"
  ON template_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own licenses"
  ON template_licenses FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Creators can view their earnings"
  ON creator_earnings FOR SELECT
  USING (auth.uid() = creator_id);

-- Function to increment template downloads
CREATE OR REPLACE FUNCTION increment_template_downloads(p_template_id VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE templates
  SET download_count = download_count + 1
  WHERE id = p_template_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get creator earnings
CREATE OR REPLACE FUNCTION get_creator_earnings(
  p_creator_id UUID,
  p_period_start DATE DEFAULT NULL,
  p_period_end DATE DEFAULT NULL
)
RETURNS TABLE (
  template_id VARCHAR,
  template_name VARCHAR,
  total_sales DECIMAL,
  creator_earnings DECIMAL,
  sales_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    trs.template_id,
    t.name,
    SUM(trs.sale_amount)::DECIMAL as total_sales,
    SUM(trs.creator_earnings)::DECIMAL as creator_earnings,
    COUNT(*)::INT as sales_count
  FROM template_revenue_splits trs
  JOIN templates t ON trs.template_id = t.id
  WHERE t.creator_id = p_creator_id
    AND (p_period_start IS NULL OR trs.recorded_at >= p_period_start)
    AND (p_period_end IS NULL OR trs.recorded_at <= p_period_end)
  GROUP BY trs.template_id, t.name
  ORDER BY creator_earnings DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get top templates
CREATE OR REPLACE FUNCTION get_top_templates(p_limit INT DEFAULT 10)
RETURNS TABLE (
  id VARCHAR,
  name VARCHAR,
  creator_id UUID,
  rating DECIMAL,
  download_count INT,
  price DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.creator_id,
    t.rating,
    t.download_count,
    t.price
  FROM templates t
  WHERE t.status = 'published'
  ORDER BY t.rating DESC, t.download_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
