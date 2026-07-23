/**
 * Portfolio Service
 * Manages campaigns, assets, and portfolio operations
 */

import { supabase } from '@/integrations/supabase/client';

export interface Campaign {
  id: string;
  portfolio_id: string;
  user_id: string;
  name: string;
  description?: string;
  input_prompt?: string;
  status: 'draft' | 'processing' | 'completed' | 'archived';
  strategy?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
}

export interface Asset {
  id: string;
  user_id: string;
  portfolio_id: string;
  name: string;
  type: string;
  file_url?: string;
  file_size?: number;
  mime_type?: string;
  dimensions?: { width: number; height: number };
  platform?: string;
  status: 'draft' | 'approved' | 'published';
  ai_model_used?: string;
  created_at: string;
  updated_at: string;
}

export interface AssetVersion {
  id: string;
  asset_id: string;
  version_number: number;
  file_url?: string;
  changes?: string;
  created_at: string;
}

export class PortfolioService {
  /**
   * Create a new campaign
   */
  static async createCampaign(
    portfolioId: string,
    data: Partial<Campaign>
  ): Promise<Campaign | null> {
    try {
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
          portfolio_id: portfolioId,
          name: data.name || 'Untitled Campaign',
          description: data.description,
          input_prompt: data.input_prompt,
          status: data.status || 'draft',
          strategy: data.strategy,
          notes: data.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return campaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      return null;
    }
  }

  /**
   * Get campaign by ID
   */
  static async getCampaign(campaignId: string): Promise<Campaign | null> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select()
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching campaign:', error);
      return null;
    }
  }

  /**
   * Get all campaigns for a portfolio
   */
  static async getCampaigns(
    portfolioId: string,
    options?: {
      status?: string;
      limit?: number;
      offset?: number;
      orderBy?: 'created_at' | 'updated_at' | 'name';
      orderDirection?: 'asc' | 'desc';
    }
  ): Promise<Campaign[]> {
    try {
      let query = supabase
        .from('campaigns')
        .select()
        .eq('portfolio_id', portfolioId);

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options.orderDirection === 'asc',
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      return [];
    }
  }

  /**
   * Update campaign
   */
  static async updateCampaign(
    campaignId: string,
    data: Partial<Campaign>
  ): Promise<Campaign | null> {
    try {
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId)
        .select()
        .single();

      if (error) throw error;
      return campaign;
    } catch (error) {
      console.error('Error updating campaign:', error);
      return null;
    }
  }

  /**
   * Archive campaign
   */
  static async archiveCampaign(campaignId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({
          status: 'archived',
          archived_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error archiving campaign:', error);
      return false;
    }
  }

  /**
   * Delete campaign
   */
  static async deleteCampaign(campaignId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting campaign:', error);
      return false;
    }
  }

  /**
   * Create a new asset
   */
  static async createAsset(
    portfolioId: string,
    data: Partial<Asset>
  ): Promise<Asset | null> {
    try {
      const { data: asset, error } = await supabase
        .from('assets')
        .insert({
          portfolio_id: portfolioId,
          name: data.name || 'Untitled Asset',
          type: data.type || 'other',
          file_url: data.file_url,
          file_size: data.file_size,
          mime_type: data.mime_type,
          dimensions: data.dimensions,
          platform: data.platform,
          status: data.status || 'draft',
          ai_model_used: data.ai_model_used,
        })
        .select()
        .single();

      if (error) throw error;
      return asset;
    } catch (error) {
      console.error('Error creating asset:', error);
      return null;
    }
  }

  /**
   * Get asset by ID
   */
  static async getAsset(assetId: string): Promise<Asset | null> {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select()
        .eq('id', assetId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching asset:', error);
      return null;
    }
  }

  /**
   * Get all assets for a portfolio
   */
  static async getAssets(
    portfolioId: string,
    options?: {
      type?: string;
      platform?: string;
      status?: string;
      limit?: number;
      offset?: number;
      orderBy?: 'created_at' | 'updated_at' | 'name';
      orderDirection?: 'asc' | 'desc';
    }
  ): Promise<Asset[]> {
    try {
      let query = supabase
        .from('assets')
        .select()
        .eq('portfolio_id', portfolioId);

      if (options?.type) {
        query = query.eq('type', options.type);
      }

      if (options?.platform) {
        query = query.eq('platform', options.platform);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options.orderDirection === 'asc',
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching assets:', error);
      return [];
    }
  }

  /**
   * Update asset
   */
  static async updateAsset(
    assetId: string,
    data: Partial<Asset>
  ): Promise<Asset | null> {
    try {
      const { data: asset, error } = await supabase
        .from('assets')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assetId)
        .select()
        .single();

      if (error) throw error;
      return asset;
    } catch (error) {
      console.error('Error updating asset:', error);
      return null;
    }
  }

  /**
   * Delete asset
   */
  static async deleteAsset(assetId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting asset:', error);
      return false;
    }
  }

  /**
   * Link asset to campaign
   */
  static async linkAssetToCampaign(
    campaignId: string,
    assetId: string,
    position?: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('campaign_assets')
        .insert({
          campaign_id: campaignId,
          asset_id: assetId,
          position: position || 0,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error linking asset to campaign:', error);
      return false;
    }
  }

  /**
   * Get assets for a campaign
   */
  static async getCampaignAssets(campaignId: string): Promise<Asset[]> {
    try {
      const { data, error } = await supabase
        .from('campaign_assets')
        .select('assets(*)')
        .eq('campaign_id', campaignId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data?.map((item: any) => item.assets) || [];
    } catch (error) {
      console.error('Error fetching campaign assets:', error);
      return [];
    }
  }

  /**
   * Create asset version
   */
  static async createAssetVersion(
    assetId: string,
    fileUrl: string,
    changes?: string
  ): Promise<AssetVersion | null> {
    try {
      // Get current version count
      const { count } = await supabase
        .from('asset_versions')
        .select('*', { count: 'exact' })
        .eq('asset_id', assetId);

      const versionNumber = (count || 0) + 1;

      const { data, error } = await supabase
        .from('asset_versions')
        .insert({
          asset_id: assetId,
          version_number: versionNumber,
          file_url: fileUrl,
          changes: changes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating asset version:', error);
      return null;
    }
  }

  /**
   * Get asset versions
   */
  static async getAssetVersions(assetId: string): Promise<AssetVersion[]> {
    try {
      const { data, error } = await supabase
        .from('asset_versions')
        .select()
        .eq('asset_id', assetId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching asset versions:', error);
      return [];
    }
  }

  /**
   * Add tag to asset
   */
  static async addAssetTag(assetId: string, tag: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('asset_tags')
        .insert({
          asset_id: assetId,
          tag: tag.toLowerCase(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding asset tag:', error);
      return false;
    }
  }

  /**
   * Get asset tags
   */
  static async getAssetTags(assetId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('asset_tags')
        .select('tag')
        .eq('asset_id', assetId);

      if (error) throw error;
      return data?.map((item) => item.tag) || [];
    } catch (error) {
      console.error('Error fetching asset tags:', error);
      return [];
    }
  }

  /**
   * Search assets by name or tags
   */
  static async searchAssets(
    portfolioId: string,
    query: string
  ): Promise<Asset[]> {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select()
        .eq('portfolio_id', portfolioId)
        .or(`name.ilike.%${query}%`);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching assets:', error);
      return [];
    }
  }

  /**
   * Add asset to favorites
   */
  static async addToFavorites(assetId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('asset_favorites')
        .insert({
          asset_id: assetId,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }
  }

  /**
   * Remove from favorites
   */
  static async removeFromFavorites(assetId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('asset_favorites')
        .delete()
        .eq('asset_id', assetId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }
  }

  /**
   * Get favorite assets
   */
  static async getFavoriteAssets(portfolioId: string): Promise<Asset[]> {
    try {
      const { data, error } = await supabase
        .from('asset_favorites')
        .select('assets(*)')
        .eq('assets.portfolio_id', portfolioId);

      if (error) throw error;
      return data?.map((item: any) => item.assets) || [];
    } catch (error) {
      console.error('Error fetching favorite assets:', error);
      return [];
    }
  }
}
