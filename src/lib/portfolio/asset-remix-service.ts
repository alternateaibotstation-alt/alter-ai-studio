/**
 * Asset Remix Service
 * Enables reusing assets across campaigns and creating new combinations
 */

import { PortfolioService, Asset } from './portfolio-service';

export interface AssetRemixOptions {
  sourceAssets: string[]; // Asset IDs to remix
  targetCampaignId: string;
  newAssetName?: string;
  transformations?: {
    resize?: { width: number; height: number };
    crop?: { x: number; y: number; width: number; height: number };
    rotate?: number;
    opacity?: number;
  };
}

export interface AssetCollection {
  id: string;
  name: string;
  description?: string;
  assetIds: string[];
  createdAt: string;
  updatedAt: string;
}

export class AssetRemixService {
  /**
   * Create a collection of assets for easy reuse
   */
  static async createCollection(
    portfolioId: string,
    name: string,
    assetIds: string[],
    description?: string
  ): Promise<AssetCollection | null> {
    try {
      // In a real implementation, this would save to the collections table
      const collection: AssetCollection = {
        id: `collection-${Date.now()}`,
        name,
        description,
        assetIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return collection;
    } catch (error) {
      console.error('Error creating collection:', error);
      return null;
    }
  }

  /**
   * Add asset to collection
   */
  static async addAssetToCollection(
    collectionId: string,
    assetId: string
  ): Promise<boolean> {
    try {
      // In a real implementation, this would update the collection
      return true;
    } catch (error) {
      console.error('Error adding asset to collection:', error);
      return false;
    }
  }

  /**
   * Remove asset from collection
   */
  static async removeAssetFromCollection(
    collectionId: string,
    assetId: string
  ): Promise<boolean> {
    try {
      // In a real implementation, this would update the collection
      return true;
    } catch (error) {
      console.error('Error removing asset from collection:', error);
      return false;
    }
  }

  /**
   * Remix assets into a new campaign
   * Combines assets from multiple campaigns into a single new campaign
   */
  static async remixAssets(
    portfolioId: string,
    options: AssetRemixOptions
  ): Promise<{ campaignId: string; assetIds: string[] } | null> {
    try {
      // Get all source assets
      const assets: Asset[] = [];
      for (const assetId of options.sourceAssets) {
        const asset = await PortfolioService.getAsset(assetId);
        if (asset) {
          assets.push(asset);
        }
      }

      if (assets.length === 0) {
        throw new Error('No valid assets found');
      }

      // Create new campaign
      const campaign = await PortfolioService.createCampaign(portfolioId, {
        name: options.newAssetName || `Remixed Campaign - ${new Date().toLocaleDateString()}`,
        description: `Remixed from ${assets.length} assets`,
        status: 'draft',
      });

      if (!campaign) {
        throw new Error('Failed to create campaign');
      }

      // Link all assets to new campaign
      const linkedAssetIds: string[] = [];
      for (let i = 0; i < assets.length; i++) {
        await PortfolioService.linkAssetToCampaign(campaign.id, assets[i].id, i);
        linkedAssetIds.push(assets[i].id);
      }

      return {
        campaignId: campaign.id,
        assetIds: linkedAssetIds,
      };
    } catch (error) {
      console.error('Error remixing assets:', error);
      return null;
    }
  }

  /**
   * Get assets by type for quick filtering
   */
  static async getAssetsByType(
    portfolioId: string,
    type: string
  ): Promise<Asset[]> {
    try {
      return await PortfolioService.getAssets(portfolioId, {
        type,
        orderBy: 'created_at',
        orderDirection: 'desc',
      });
    } catch (error) {
      console.error('Error fetching assets by type:', error);
      return [];
    }
  }

  /**
   * Get assets by platform
   */
  static async getAssetsByPlatform(
    portfolioId: string,
    platform: string
  ): Promise<Asset[]> {
    try {
      return await PortfolioService.getAssets(portfolioId, {
        platform,
        orderBy: 'created_at',
        orderDirection: 'desc',
      });
    } catch (error) {
      console.error('Error fetching assets by platform:', error);
      return [];
    }
  }

  /**
   * Get similar assets based on tags
   */
  static async getSimilarAssets(
    portfolioId: string,
    assetId: string
  ): Promise<Asset[]> {
    try {
      const asset = await PortfolioService.getAsset(assetId);
      if (!asset) return [];

      const tags = await PortfolioService.getAssetTags(assetId);
      if (tags.length === 0) return [];

      // Get assets with similar tags
      const allAssets = await PortfolioService.getAssets(portfolioId, {
        type: asset.type,
      });

      // Filter to assets that share tags
      const similar: Asset[] = [];
      for (const otherAsset of allAssets) {
        if (otherAsset.id === assetId) continue;

        const otherTags = await PortfolioService.getAssetTags(otherAsset.id);
        const sharedTags = tags.filter((tag) => otherTags.includes(tag));

        if (sharedTags.length > 0) {
          similar.push(otherAsset);
        }
      }

      return similar;
    } catch (error) {
      console.error('Error finding similar assets:', error);
      return [];
    }
  }

  /**
   * Create asset variant (copy with modifications)
   */
  static async createAssetVariant(
    portfolioId: string,
    sourceAssetId: string,
    variantName: string,
    transformations?: AssetRemixOptions['transformations']
  ): Promise<Asset | null> {
    try {
      const sourceAsset = await PortfolioService.getAsset(sourceAssetId);
      if (!sourceAsset) {
        throw new Error('Source asset not found');
      }

      // Create new asset as variant
      const variant = await PortfolioService.createAsset(portfolioId, {
        name: variantName,
        type: sourceAsset.type,
        file_url: sourceAsset.file_url,
        mime_type: sourceAsset.mime_type,
        platform: sourceAsset.platform,
        status: 'draft',
      });

      if (!variant) {
        throw new Error('Failed to create variant');
      }

      // Create version with transformation notes
      if (transformations) {
        await PortfolioService.createAssetVersion(
          variant.id,
          sourceAsset.file_url || '',
          `Variant: ${JSON.stringify(transformations)}`
        );
      }

      // Copy tags
      const tags = await PortfolioService.getAssetTags(sourceAssetId);
      for (const tag of tags) {
        await PortfolioService.addAssetTag(variant.id, tag);
      }

      return variant;
    } catch (error) {
      console.error('Error creating asset variant:', error);
      return null;
    }
  }

  /**
   * Batch remix - create multiple campaigns from asset combinations
   */
  static async batchRemix(
    portfolioId: string,
    combinations: Array<{
      name: string;
      assetIds: string[];
    }>
  ): Promise<Array<{ campaignId: string; assetIds: string[] }>> {
    const results: Array<{ campaignId: string; assetIds: string[] }> = [];

    for (const combination of combinations) {
      const result = await this.remixAssets(portfolioId, {
        sourceAssets: combination.assetIds,
        targetCampaignId: '', // Not used in this context
        newAssetName: combination.name,
      });

      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Get asset usage statistics
   */
  static async getAssetUsageStats(assetId: string): Promise<{
    totalCampaigns: number;
    totalViews: number;
    lastUsed?: string;
  }> {
    try {
      // In a real implementation, this would query usage statistics
      return {
        totalCampaigns: 0,
        totalViews: 0,
      };
    } catch (error) {
      console.error('Error fetching asset usage stats:', error);
      return {
        totalCampaigns: 0,
        totalViews: 0,
      };
    }
  }

  /**
   * Get most used assets
   */
  static async getMostUsedAssets(
    portfolioId: string,
    limit: number = 10
  ): Promise<Array<Asset & { usageCount: number }>> {
    try {
      const assets = await PortfolioService.getAssets(portfolioId, {
        limit,
        orderBy: 'created_at',
        orderDirection: 'desc',
      });

      // In a real implementation, this would include usage counts
      return assets.map((asset) => ({
        ...asset,
        usageCount: 0,
      }));
    } catch (error) {
      console.error('Error fetching most used assets:', error);
      return [];
    }
  }

  /**
   * Suggest asset combinations based on campaign type
   */
  static async suggestAssetCombinations(
    portfolioId: string,
    campaignType: string
  ): Promise<Array<{ assetIds: string[]; name: string; score: number }>> {
    try {
      // In a real implementation, this would use ML to suggest combinations
      return [];
    } catch (error) {
      console.error('Error suggesting asset combinations:', error);
      return [];
    }
  }
}
