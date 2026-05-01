-- Ad Campaigns table for AlterAI Ad Engine
-- Stores full campaign results including brief, insights, and generated ads

CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_description TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'viral',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  call_to_action TEXT,
  brand_voice TEXT,
  competitor_context TEXT,

  -- AI pipeline outputs (stored as JSONB for flexibility)
  product_insight JSONB,
  audience_profile JSONB,
  hooks JSONB DEFAULT '[]'::jsonb,
  ads JSONB DEFAULT '[]'::jsonb,

  credits_used INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns"
  ON public.ad_campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns"
  ON public.ad_campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns"
  ON public.ad_campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns"
  ON public.ad_campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_ad_campaigns_user_id ON public.ad_campaigns(user_id);
CREATE INDEX idx_ad_campaigns_created_at ON public.ad_campaigns(created_at DESC);
CREATE INDEX idx_ad_campaigns_status ON public.ad_campaigns(status);
