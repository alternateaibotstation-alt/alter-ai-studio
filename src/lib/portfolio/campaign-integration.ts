/**
 * Campaign Integration Service
 * Handles auto-saving campaigns and creating assets from generated content
 */

import { PortfolioService } from './portfolio-service';

export interface GeneratedContent {
  images?: string[];
  videos?: string[];
  scripts?: string[];
  captions?: string[];
  prompts?: string[];
  thumbnails?: string[];
  documents?: string[];
  metadata?: Record<string, any>;
}

export interface CampaignSaveData {
  name: string;
  description?: string;
  inputPrompt: string;
  strategy?: string;
  notes?: string;
  content: GeneratedContent;
  platformFormats?: Record<string, any>;
}

export class CampaignIntegrationService {
  /**
   * Save a generated campaign with all assets
   */
  static async saveCampaign(
    portfolioId: string,
    campaignData: CampaignSaveData
  ): Promise<{ campaignId: string; assetIds: string[] } | null> {
    try {
      // Create campaign
      const campaign = await PortfolioService.createCampaign(portfolioId, {
        name: campaignData.name,
        description: campaignData.description,
        input_prompt: campaignData.inputPrompt,
        strategy: campaignData.strategy,
        notes: campaignData.notes,
        status: 'completed',
      });

      if (!campaign) {
        throw new Error('Failed to create campaign');
      }

      const assetIds: string[] = [];

      // Create assets from generated content
      if (campaignData.content.images) {
        for (let i = 0; i < campaignData.content.images.length; i++) {
          const asset = await PortfolioService.createAsset(portfolioId, {
            name: `${campaignData.name} - Image ${i + 1}`,
            type: 'image',
            file_url: campaignData.content.images[i],
            mime_type: 'image/png',
            platform: 'universal',
            status: 'approved',
          });
          if (asset) {
            assetIds.push(asset.id);
            // Link asset to campaign
            await PortfolioService.linkAssetToCampaign(campaign.id, asset.id, i);
          }
        }
      }

      if (campaignData.content.videos) {
        for (let i = 0; i < campaignData.content.videos.length; i++) {
          const asset = await PortfolioService.createAsset(portfolioId, {
            name: `${campaignData.name} - Video ${i + 1}`,
            type: 'video',
            file_url: campaignData.content.videos[i],
            mime_type: 'video/mp4',
            platform: 'universal',
            status: 'approved',
          });
          if (asset) {
            assetIds.push(asset.id);
            await PortfolioService.linkAssetToCampaign(campaign.id, asset.id, i);
          }
        }
      }

      if (campaignData.content.scripts) {
        for (let i = 0; i < campaignData.content.scripts.length; i++) {
          const asset = await PortfolioService.createAsset(portfolioId, {
            name: `${campaignData.name} - Script ${i + 1}`,
            type: 'script',
            file_url: campaignData.content.scripts[i],
            mime_type: 'text/plain',
            platform: 'universal',
            status: 'approved',
          });
          if (asset) {
            assetIds.push(asset.id);
            await PortfolioService.linkAssetToCampaign(campaign.id, asset.id, i);
          }
        }
      }

      if (campaignData.content.captions) {
        for (let i = 0; i < campaignData.content.captions.length; i++) {
          const asset = await PortfolioService.createAsset(portfolioId, {
            name: `${campaignData.name} - Caption ${i + 1}`,
            type: 'caption',
            file_url: campaignData.content.captions[i],
            mime_type: 'text/plain',
            platform: 'universal',
            status: 'approved',
          });
          if (asset) {
            assetIds.push(asset.id);
            await PortfolioService.linkAssetToCampaign(campaign.id, asset.id, i);
          }
        }
      }

      if (campaignData.content.documents) {
        for (let i = 0; i < campaignData.content.documents.length; i++) {
          const asset = await PortfolioService.createAsset(portfolioId, {
            name: `${campaignData.name} - Document ${i + 1}`,
            type: 'pdf',
            file_url: campaignData.content.documents[i],
            mime_type: 'application/pdf',
            platform: 'universal',
            status: 'approved',
          });
          if (asset) {
            assetIds.push(asset.id);
            await PortfolioService.linkAssetToCampaign(campaign.id, asset.id, i);
          }
        }
      }

      // Add tags to campaign
      const tags = ['auto-generated', 'campaign', ...campaignData.strategy?.split(',') || []];
      for (const tag of tags) {
        await PortfolioService.addAssetTag(campaign.id, tag);
      }

      return {
        campaignId: campaign.id,
        assetIds,
      };
    } catch (error) {
      console.error('Error saving campaign:', error);
      return null;
    }
  }

  /**
   * Save draft campaign (auto-save)
   */
  static async saveDraftCampaign(
    portfolioId: string,
    campaignData: Partial<CampaignSaveData>
  ): Promise<string | null> {
    try {
      const campaign = await PortfolioService.createCampaign(portfolioId, {
        name: campaignData.name || 'Untitled Draft',
        description: campaignData.description,
        input_prompt: campaignData.inputPrompt,
        strategy: campaignData.strategy,
        notes: campaignData.notes,
        status: 'draft',
      });

      return campaign?.id || null;
    } catch (error) {
      console.error('Error saving draft campaign:', error);
      return null;
    }
  }

  /**
   * Update draft campaign (auto-save)
   */
  static async updateDraftCampaign(
    campaignId: string,
    campaignData: Partial<CampaignSaveData>
  ): Promise<boolean> {
    try {
      await PortfolioService.updateCampaign(campaignId, {
        name: campaignData.name,
        description: campaignData.description,
        input_prompt: campaignData.inputPrompt,
        strategy: campaignData.strategy,
        notes: campaignData.notes,
      });
      return true;
    } catch (error) {
      console.error('Error updating draft campaign:', error);
      return false;
    }
  }

  /**
   * Create platform-specific versions of assets
   */
  static async createPlatformVersions(
    portfolioId: string,
    assetId: string,
    platforms: string[]
  ): Promise<Record<string, string>> {
    try {
      const asset = await PortfolioService.getAsset(assetId);
      if (!asset) throw new Error('Asset not found');

      const versions: Record<string, string> = {};

      for (const platform of platforms) {
        // In a real app, this would call a service to resize/format the asset
        // For now, we'll create a version record
        const version = await PortfolioService.createAssetVersion(
          assetId,
          asset.file_url || '',
          `Platform version for ${platform}`
        );

        if (version) {
          versions[platform] = version.id;
        }
      }

      return versions;
    } catch (error) {
      console.error('Error creating platform versions:', error);
      return {};
    }
  }

  /**
   * Get campaign with all assets
   */
  static async getCampaignWithAssets(campaignId: string) {
    try {
      const campaign = await PortfolioService.getCampaign(campaignId);
      if (!campaign) return null;

      const assets = await PortfolioService.getCampaignAssets(campaignId);

      return {
        campaign,
        assets,
      };
    } catch (error) {
      console.error('Error fetching campaign with assets:', error);
      return null;
    }
  }

  /**
   * Duplicate campaign with all assets
   */
  static async duplicateCampaign(
    portfolioId: string,
    campaignId: string
  ): Promise<string | null> {
    try {
      const campaignData = await this.getCampaignWithAssets(campaignId);
      if (!campaignData) throw new Error('Campaign not found');

      const { campaign, assets } = campaignData;

      // Create new campaign
      const newCampaign = await PortfolioService.createCampaign(portfolioId, {
        name: `${campaign.name} (Copy)`,
        description: campaign.description,
        input_prompt: campaign.input_prompt,
        strategy: campaign.strategy,
        notes: campaign.notes,
        status: 'draft',
      });

      if (!newCampaign) throw new Error('Failed to create duplicate campaign');

      // Duplicate assets
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        const newAsset = await PortfolioService.createAsset(portfolioId, {
          name: `${asset.name} (Copy)`,
          type: asset.type,
          file_url: asset.file_url,
          mime_type: asset.mime_type,
          dimensions: asset.dimensions,
          platform: asset.platform,
          status: asset.status,
          ai_model_used: asset.ai_model_used,
        });

        if (newAsset) {
          await PortfolioService.linkAssetToCampaign(newCampaign.id, newAsset.id, i);
        }
      }

      return newCampaign.id;
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      return null;
    }
  }

  /**
   * Export campaign for sharing
   */
  static async exportCampaign(campaignId: string) {
    try {
      const campaignData = await this.getCampaignWithAssets(campaignId);
      if (!campaignData) throw new Error('Campaign not found');

      const { campaign, assets } = campaignData;

      return {
        campaign,
        assets,
        exportedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error exporting campaign:', error);
      return null;
    }
  }

  /**
   * Archive campaign
   */
  static async archiveCampaign(campaignId: string): Promise<boolean> {
    try {
      return await PortfolioService.archiveCampaign(campaignId);
    } catch (error) {
      console.error('Error archiving campaign:', error);
      return false;
    }
  }
}
