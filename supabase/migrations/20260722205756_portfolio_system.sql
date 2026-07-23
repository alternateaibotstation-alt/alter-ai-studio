-- Portfolio System Migration
-- Creates comprehensive portfolio, campaign, and asset management tables

-- Portfolios table
CREATE TABLE public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Portfolio',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own portfolios" ON public.portfolios FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own portfolios" ON public.portfolios FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own portfolios" ON public.portfolios FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own portfolios" ON public.portfolios FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  input_prompt TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'archived')),
  strategy TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  UNIQUE(portfolio_id, id)
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own campaigns" ON public.campaigns FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own campaigns" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON public.campaigns FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON public.campaigns FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Assets table
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'script', 'caption', 'hashtag', 'headline', 'email', 'blog', 'storyboard', 'voiceover', 'audio', 'pdf', 'brand_kit', 'color_palette', 'font', 'icon', 'mockup', 'other')),
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  dimensions JSONB, -- {width, height}
  platform TEXT CHECK (platform IN ('tiktok', 'instagram_feed', 'instagram_story', 'instagram_reel', 'facebook_post', 'facebook_story', 'youtube_shorts', 'youtube', 'linkedin', 'x', 'pinterest', 'snapchat', 'threads', 'email', 'blog', 'google_ads', 'display_ads', 'universal')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'published')),
  ai_model_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own assets" ON public.assets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assets" ON public.assets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assets" ON public.assets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assets" ON public.assets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Asset versions table
CREATE TABLE public.asset_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_url TEXT,
  changes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(asset_id, version_number)
);

ALTER TABLE public.asset_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own asset versions" ON public.asset_versions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.assets WHERE id = asset_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own asset versions" ON public.asset_versions FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.assets WHERE id = asset_id AND user_id = auth.uid())
);

-- Campaign-Assets junction table (many-to-many)
CREATE TABLE public.campaign_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, asset_id)
);

ALTER TABLE public.campaign_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own campaign assets" ON public.campaign_assets FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own campaign assets" ON public.campaign_assets FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own campaign assets" ON public.campaign_assets FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND user_id = auth.uid())
);

-- Folders table
CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own folders" ON public.folders FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.portfolios WHERE id = portfolio_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own folders" ON public.folders FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.portfolios WHERE id = portfolio_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own folders" ON public.folders FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.portfolios WHERE id = portfolio_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own folders" ON public.folders FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.portfolios WHERE id = portfolio_id AND user_id = auth.uid())
);

-- Collections table
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own collections" ON public.collections FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.portfolios WHERE id = portfolio_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own collections" ON public.collections FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.portfolios WHERE id = portfolio_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own collections" ON public.collections FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.portfolios WHERE id = portfolio_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own collections" ON public.collections FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.portfolios WHERE id = portfolio_id AND user_id = auth.uid())
);

-- Brand Kits table
CREATE TABLE public.brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  colors JSONB, -- [{name: string, hex: string, rgb: string}, ...]
  fonts JSONB, -- [{name: string, family: string, url: string}, ...]
  logos JSONB, -- [{name: string, url: string, type: string}, ...]
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own brand kits" ON public.brand_kits FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.portfolios WHERE id = portfolio_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own brand kits" ON public.brand_kits FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.portfolios WHERE id = portfolio_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own brand kits" ON public.brand_kits FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.portfolios WHERE id = portfolio_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own brand kits" ON public.brand_kits FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.portfolios WHERE id = portfolio_id AND user_id = auth.uid())
);

-- Templates table
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  canvas_data JSONB, -- Complete canvas state for reuse
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own templates" ON public.templates FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.portfolios WHERE id = portfolio_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own templates" ON public.templates FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.portfolios WHERE id = portfolio_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own templates" ON public.templates FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.portfolios WHERE id = portfolio_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own templates" ON public.templates FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.portfolios WHERE id = portfolio_id AND user_id = auth.uid())
);

-- Asset Favorites table
CREATE TABLE public.asset_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, asset_id)
);

ALTER TABLE public.asset_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own favorites" ON public.asset_favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.asset_favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.asset_favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Asset Tags table
CREATE TABLE public.asset_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(asset_id, tag)
);

ALTER TABLE public.asset_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own asset tags" ON public.asset_tags FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.assets WHERE id = asset_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own asset tags" ON public.asset_tags FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.assets WHERE id = asset_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete own asset tags" ON public.asset_tags FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.assets WHERE id = asset_id AND user_id = auth.uid())
);

-- Soft Deletes (Trash) table
CREATE TABLE public.soft_deletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  restored_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.soft_deletes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own soft deletes" ON public.soft_deletes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own soft deletes" ON public.soft_deletes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own soft deletes" ON public.soft_deletes FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Campaign Version History table
CREATE TABLE public.campaign_version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  campaign_data JSONB NOT NULL, -- Complete campaign state
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, version_number)
);

ALTER TABLE public.campaign_version_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own campaign versions" ON public.campaign_version_history FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own campaign versions" ON public.campaign_version_history FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND user_id = auth.uid())
);

-- Create indexes for performance
CREATE INDEX idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX idx_campaigns_portfolio_id ON public.campaigns(portfolio_id);
CREATE INDEX idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_created_at ON public.campaigns(created_at DESC);
CREATE INDEX idx_assets_user_id ON public.assets(user_id);
CREATE INDEX idx_assets_portfolio_id ON public.assets(portfolio_id);
CREATE INDEX idx_assets_type ON public.assets(type);
CREATE INDEX idx_assets_platform ON public.assets(platform);
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_assets_created_at ON public.assets(created_at DESC);
CREATE INDEX idx_campaign_assets_campaign_id ON public.campaign_assets(campaign_id);
CREATE INDEX idx_campaign_assets_asset_id ON public.campaign_assets(asset_id);
CREATE INDEX idx_asset_tags_asset_id ON public.asset_tags(asset_id);
CREATE INDEX idx_asset_tags_tag ON public.asset_tags(tag);
CREATE INDEX idx_asset_favorites_user_id ON public.asset_favorites(user_id);
CREATE INDEX idx_asset_favorites_asset_id ON public.asset_favorites(asset_id);
CREATE INDEX idx_soft_deletes_user_id ON public.soft_deletes(user_id);
CREATE INDEX idx_soft_deletes_deleted_at ON public.soft_deletes(deleted_at DESC);

-- Auto-create portfolio on user signup
CREATE OR REPLACE FUNCTION public.create_default_portfolio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.portfolios (user_id, name)
  VALUES (NEW.id, 'My Portfolio');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_portfolio
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_portfolio();
