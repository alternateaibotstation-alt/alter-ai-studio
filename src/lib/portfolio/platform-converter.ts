/**
 * Platform Format Converter
 * Converts assets to platform-specific formats with proper dimensions, aspect ratios, and specs
 */

import { PLATFORM_FORMATS } from './platform-formats';

export interface ConversionOptions {
  quality?: number; // 0-100
  format?: 'png' | 'jpg' | 'webp' | 'mp4' | 'gif';
  backgroundColor?: string;
  padding?: number;
  maintainAspectRatio?: boolean;
}

export class PlatformConverter {
  /**
   * Get format specs for a platform
   */
  static getFormatSpecs(platform: string) {
    return PLATFORM_FORMATS[platform as keyof typeof PLATFORM_FORMATS];
  }

  /**
   * Convert asset dimensions to platform specs
   */
  static convertDimensions(
    platform: string,
    originalWidth: number,
    originalHeight: number,
    options: ConversionOptions = {}
  ) {
    const specs = this.getFormatSpecs(platform);
    if (!specs) {
      throw new Error(`Unknown platform: ${platform}`);
    }

    const targetDimensions = specs.dimensions[0]; // Get first recommended dimension
    const aspectRatio = targetDimensions.width / targetDimensions.height;
    const originalAspectRatio = originalWidth / originalHeight;

    let width = targetDimensions.width;
    let height = targetDimensions.height;
    let offsetX = 0;
    let offsetY = 0;

    if (options.maintainAspectRatio) {
      if (originalAspectRatio > aspectRatio) {
        // Original is wider, fit to height
        width = Math.round(height * originalAspectRatio);
        offsetX = Math.round((width - targetDimensions.width) / 2);
      } else {
        // Original is taller, fit to width
        height = Math.round(width / originalAspectRatio);
        offsetY = Math.round((height - targetDimensions.height) / 2);
      }
    }

    return {
      width: targetDimensions.width,
      height: targetDimensions.height,
      sourceWidth: width,
      sourceHeight: height,
      offsetX,
      offsetY,
      aspectRatio,
      safeZone: specs.safeZone,
    };
  }

  /**
   * Get export settings for a platform
   */
  static getExportSettings(platform: string, options: ConversionOptions = {}) {
    const specs = this.getFormatSpecs(platform);
    if (!specs) {
      throw new Error(`Unknown platform: ${platform}`);
    }

    return {
      dimensions: specs.dimensions[0],
      aspectRatio: specs.aspectRatio[0],
      maxFileSize: specs.maxFileSize,
      supportedFormats: specs.supportedFormats,
      quality: options.quality || 85,
      format: options.format || specs.supportedFormats[0],
      safeZone: specs.safeZone,
      captionLength: specs.captionLength,
      hashtagLimit: specs.hashtagLimit,
      bestPractices: specs.bestPractices,
    };
  }

  /**
   * Get all platform versions needed
   */
  static getAllPlatformVersions() {
    return Object.keys(PLATFORM_FORMATS).map((platform) => ({
      platform,
      specs: this.getFormatSpecs(platform),
    }));
  }

  /**
   * Validate asset for platform
   */
  static validateAssetForPlatform(
    platform: string,
    fileSize: number,
    dimensions?: { width: number; height: number }
  ): { valid: boolean; errors: string[] } {
    const specs = this.getFormatSpecs(platform);
    if (!specs) {
      return { valid: false, errors: [`Unknown platform: ${platform}`] };
    }

    const errors: string[] = [];

    // Check file size
    if (fileSize > specs.maxFileSize) {
      errors.push(
        `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds limit of ${(specs.maxFileSize / 1024 / 1024).toFixed(2)}MB`
      );
    }

    // Check dimensions
    if (dimensions) {
      const validDimension = specs.dimensions.some(
        (dim) => dim.width === dimensions.width && dim.height === dimensions.height
      );
      if (!validDimension) {
        errors.push(
          `Dimensions ${dimensions.width}x${dimensions.height} not recommended for ${platform}. Recommended: ${specs.dimensions.map((d) => `${d.width}x${d.height}`).join(', ')}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get recommended caption length for platform
   */
  static getCaptionLength(platform: string): number {
    const specs = this.getFormatSpecs(platform);
    return specs?.captionLength || 280;
  }

  /**
   * Get hashtag limit for platform
   */
  static getHashtagLimit(platform: string): number {
    const specs = this.getFormatSpecs(platform);
    return specs?.hashtagLimit || 30;
  }

  /**
   * Get best practices for platform
   */
  static getBestPractices(platform: string): string[] {
    const specs = this.getFormatSpecs(platform);
    return specs?.bestPractices || [];
  }

  /**
   * Generate platform-specific export filename
   */
  static generateExportFilename(
    baseName: string,
    platform: string,
    format: string = 'png'
  ): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitized = baseName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `${sanitized}_${platform}_${timestamp}.${format}`;
  }

  /**
   * Get all platforms that support a specific format
   */
  static getPlatformsForFormat(format: 'image' | 'video' | 'gif' | 'pdf'): string[] {
    return Object.entries(PLATFORM_FORMATS)
      .filter(([_, specs]) => specs.supportedFormats.includes(format))
      .map(([platform]) => platform);
  }

  /**
   * Batch convert asset to multiple platforms
   */
  static async batchConvert(
    assetUrl: string,
    platforms: string[],
    options: ConversionOptions = {}
  ): Promise<Record<string, { url: string; specs: any }>> {
    const results: Record<string, { url: string; specs: any }> = {};

    for (const platform of platforms) {
      try {
        const specs = this.getExportSettings(platform, options);
        // In a real implementation, this would call an image processing service
        // For now, we'll just return the specs
        results[platform] = {
          url: assetUrl, // Would be the converted URL
          specs,
        };
      } catch (error) {
        console.error(`Error converting to ${platform}:`, error);
      }
    }

    return results;
  }
}
