/**
 * Platform Format Specifications
 * Defines dimensions, aspect ratios, safe zones, and best practices for each platform
 */

export interface PlatformFormat {
  id: string;
  name: string;
  displayName: string;
  dimensions: {
    width: number;
    height: number;
  };
  aspectRatio: string;
  safeZone: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  maxFileSize: number; // in MB
  supportedFormats: string[];
  maxCaptionLength: number;
  maxHashtags: number;
  recommendations: string[];
}

export const PLATFORM_FORMATS: Record<string, PlatformFormat> = {
  // TikTok
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    displayName: 'TikTok',
    dimensions: { width: 1080, height: 1920 },
    aspectRatio: '9:16',
    safeZone: { top: 100, bottom: 100, left: 50, right: 50 },
    maxFileSize: 287.6, // 287.6 MB
    supportedFormats: ['mp4', 'mov', 'avi', 'webm'],
    maxCaptionLength: 2200,
    maxHashtags: 30,
    recommendations: [
      'Vertical video (9:16)',
      'Captions on screen recommended',
      'Hook viewers in first 3 seconds',
      'Use trending sounds',
      'Include call-to-action',
      'Keep text legible at mobile size',
    ],
  },

  // Instagram Feed
  instagram_feed: {
    id: 'instagram_feed',
    name: 'Instagram Feed',
    displayName: 'Instagram Feed Post',
    dimensions: { width: 1080, height: 1080 },
    aspectRatio: '1:1',
    safeZone: { top: 50, bottom: 50, left: 50, right: 50 },
    maxFileSize: 8,
    supportedFormats: ['jpg', 'png', 'gif'],
    maxCaptionLength: 2200,
    maxHashtags: 30,
    recommendations: [
      'Square format (1:1)',
      'High resolution (1080x1080)',
      'Use first line strategically',
      'Include hashtags in caption or first comment',
      'Optimal posting times: 11am-1pm, 7pm-9pm',
    ],
  },

  // Instagram Story
  instagram_story: {
    id: 'instagram_story',
    name: 'Instagram Story',
    displayName: 'Instagram Story',
    dimensions: { width: 1080, height: 1920 },
    aspectRatio: '9:16',
    safeZone: { top: 150, bottom: 150, left: 50, right: 50 },
    maxFileSize: 100,
    supportedFormats: ['jpg', 'png', 'mp4', 'mov'],
    maxCaptionLength: 200,
    maxHashtags: 10,
    recommendations: [
      'Vertical video (9:16)',
      'Keep text away from top and bottom',
      'Stories disappear after 24 hours',
      'Add interactive stickers',
      'Use bright, eye-catching colors',
      'Optimal duration: 5-15 seconds',
    ],
  },

  // Instagram Reel
  instagram_reel: {
    id: 'instagram_reel',
    name: 'Instagram Reel',
    displayName: 'Instagram Reel',
    dimensions: { width: 1080, height: 1920 },
    aspectRatio: '9:16',
    safeZone: { top: 100, bottom: 100, left: 50, right: 50 },
    maxFileSize: 4000,
    supportedFormats: ['mp4', 'mov'],
    maxCaptionLength: 2200,
    maxHashtags: 30,
    recommendations: [
      'Vertical video (9:16)',
      'Duration: 15 seconds to 90 seconds',
      'Hook in first 1-2 seconds',
      'Use trending audio',
      'Include captions/text overlays',
      'Trending Reels get more reach',
    ],
  },

  // Facebook Post
  facebook_post: {
    id: 'facebook_post',
    name: 'Facebook Post',
    displayName: 'Facebook Post',
    dimensions: { width: 1200, height: 628 },
    aspectRatio: '1.91:1',
    safeZone: { top: 50, bottom: 50, left: 50, right: 50 },
    maxFileSize: 8,
    supportedFormats: ['jpg', 'png', 'gif'],
    maxCaptionLength: 63206,
    maxHashtags: 30,
    recommendations: [
      'Landscape format (1.91:1)',
      'Text should be <20% of image',
      'Use high-contrast colors',
      'Include engaging copy',
      'Post when audience is most active',
    ],
  },

  // Facebook Story
  facebook_story: {
    id: 'facebook_story',
    name: 'Facebook Story',
    displayName: 'Facebook Story',
    dimensions: { width: 1080, height: 1920 },
    aspectRatio: '9:16',
    safeZone: { top: 150, bottom: 150, left: 50, right: 50 },
    maxFileSize: 100,
    supportedFormats: ['jpg', 'png', 'mp4', 'mov'],
    maxCaptionLength: 200,
    maxHashtags: 10,
    recommendations: [
      'Vertical video (9:16)',
      'Keep text away from edges',
      'Stories disappear after 24 hours',
      'Add interactive elements',
      'Optimal duration: 5-15 seconds',
    ],
  },

  // YouTube Shorts
  youtube_shorts: {
    id: 'youtube_shorts',
    name: 'YouTube Shorts',
    displayName: 'YouTube Shorts',
    dimensions: { width: 1080, height: 1920 },
    aspectRatio: '9:16',
    safeZone: { top: 100, bottom: 100, left: 50, right: 50 },
    maxFileSize: 256,
    supportedFormats: ['mp4', 'mov', 'webm'],
    maxCaptionLength: 5000,
    maxHashtags: 30,
    recommendations: [
      'Vertical video (9:16)',
      'Duration: 15-60 seconds',
      'Hook viewers immediately',
      'Use captions/text overlays',
      'Include call-to-action',
      'Trending sounds boost reach',
    ],
  },

  // YouTube
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    displayName: 'YouTube Video',
    dimensions: { width: 1280, height: 720 },
    aspectRatio: '16:9',
    safeZone: { top: 50, bottom: 50, left: 50, right: 50 },
    maxFileSize: 256000, // 256 GB
    supportedFormats: ['mp4', 'mov', 'avi', 'mkv', 'flv', 'webm'],
    maxCaptionLength: 5000,
    maxHashtags: 30,
    recommendations: [
      'Landscape format (16:9)',
      'Minimum resolution: 720p (1280x720)',
      'Recommended: 1080p or 4K',
      'Thumbnail: 1280x720 (16:9)',
      'Title: 60 characters max',
      'Description: 5000 characters',
      'Upload in highest quality available',
    ],
  },

  // LinkedIn
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    displayName: 'LinkedIn Post',
    dimensions: { width: 1200, height: 627 },
    aspectRatio: '1.91:1',
    safeZone: { top: 50, bottom: 50, left: 50, right: 50 },
    maxFileSize: 10,
    supportedFormats: ['jpg', 'png', 'gif', 'mp4'],
    maxCaptionLength: 3000,
    maxHashtags: 30,
    recommendations: [
      'Professional tone',
      'B2B focused content',
      'Include industry insights',
      'Use relevant hashtags',
      'Encourage engagement',
      'Best posting time: Tuesday-Thursday, 8am-10am',
    ],
  },

  // X (Twitter)
  x: {
    id: 'x',
    name: 'X',
    displayName: 'X (Twitter)',
    dimensions: { width: 1200, height: 675 },
    aspectRatio: '16:9',
    safeZone: { top: 50, bottom: 50, left: 50, right: 50 },
    maxFileSize: 5,
    supportedFormats: ['jpg', 'png', 'gif', 'mp4'],
    maxCaptionLength: 280,
    maxHashtags: 5,
    recommendations: [
      'Concise copy (280 characters)',
      'Use 1-2 hashtags max',
      'Include call-to-action',
      'Engage with replies quickly',
      'Best posting time: 8am-10am, 5pm-6pm',
      'Retweets boost reach',
    ],
  },

  // Pinterest
  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    displayName: 'Pinterest Pin',
    dimensions: { width: 1000, height: 1500 },
    aspectRatio: '2:3',
    safeZone: { top: 100, bottom: 100, left: 50, right: 50 },
    maxFileSize: 20,
    supportedFormats: ['jpg', 'png', 'gif'],
    maxCaptionLength: 500,
    maxHashtags: 20,
    recommendations: [
      'Vertical format (2:3)',
      'High-quality, eye-catching images',
      'Include text overlay (top 20%)',
      'Use descriptive, keyword-rich descriptions',
      'Include call-to-action',
      'Best performing: DIY, fashion, food, home',
    ],
  },

  // Snapchat
  snapchat: {
    id: 'snapchat',
    name: 'Snapchat',
    displayName: 'Snapchat Snap',
    dimensions: { width: 1080, height: 1920 },
    aspectRatio: '9:16',
    safeZone: { top: 150, bottom: 150, left: 50, right: 50 },
    maxFileSize: 100,
    supportedFormats: ['jpg', 'png', 'mp4', 'mov'],
    maxCaptionLength: 250,
    maxHashtags: 10,
    recommendations: [
      'Vertical video (9:16)',
      'Duration: 3-10 seconds optimal',
      'Snapchat filters popular',
      'Authentic, unpolished content performs well',
      'Audience: Gen Z, younger millennials',
    ],
  },

  // Threads
  threads: {
    id: 'threads',
    name: 'Threads',
    displayName: 'Threads Post',
    dimensions: { width: 1080, height: 1350 },
    aspectRatio: '4:5',
    safeZone: { top: 50, bottom: 50, left: 50, right: 50 },
    maxFileSize: 8,
    supportedFormats: ['jpg', 'png', 'gif'],
    maxCaptionLength: 500,
    maxHashtags: 30,
    recommendations: [
      'Vertical format (4:5)',
      'Similar to Instagram Feed',
      'Conversational tone',
      'Encourage discussion',
      'Use relevant hashtags',
    ],
  },

  // Email
  email: {
    id: 'email',
    name: 'Email',
    displayName: 'Email Campaign',
    dimensions: { width: 600, height: 800 },
    aspectRatio: '3:4',
    safeZone: { top: 30, bottom: 30, left: 30, right: 30 },
    maxFileSize: 2,
    supportedFormats: ['jpg', 'png', 'gif'],
    maxCaptionLength: 2000,
    maxHashtags: 0,
    recommendations: [
      'Mobile-first design (600px width)',
      'Subject line: 50 characters max',
      'Preview text: 100 characters',
      'Call-to-action button prominent',
      'Test on multiple email clients',
      'Optimal send time: Tuesday-Thursday, 10am-2pm',
    ],
  },

  // Blog
  blog: {
    id: 'blog',
    name: 'Blog',
    displayName: 'Blog Featured Image',
    dimensions: { width: 1200, height: 628 },
    aspectRatio: '1.91:1',
    safeZone: { top: 50, bottom: 50, left: 50, right: 50 },
    maxFileSize: 5,
    supportedFormats: ['jpg', 'png', 'gif'],
    maxCaptionLength: 5000,
    maxHashtags: 30,
    recommendations: [
      'Landscape format (1.91:1)',
      'High contrast for readability',
      'Include text overlay with title',
      'Use consistent branding',
      'Optimize for social sharing',
    ],
  },

  // Google Ads
  google_ads: {
    id: 'google_ads',
    name: 'Google Ads',
    displayName: 'Google Search Ad',
    dimensions: { width: 1200, height: 628 },
    aspectRatio: '1.91:1',
    safeZone: { top: 50, bottom: 50, left: 50, right: 50 },
    maxFileSize: 5,
    supportedFormats: ['jpg', 'png', 'gif'],
    maxCaptionLength: 90,
    maxHashtags: 0,
    recommendations: [
      'Headline: 30 characters max',
      'Description: 90 characters max',
      'Display URL: 35 characters max',
      'Include call-to-action',
      'A/B test multiple variations',
      'Focus on benefits, not features',
    ],
  },

  // Display Ads
  display_ads: {
    id: 'display_ads',
    name: 'Display Ads',
    displayName: 'Display Banner Ad',
    dimensions: { width: 728, height: 90 },
    aspectRatio: '8:1',
    safeZone: { top: 10, bottom: 10, left: 10, right: 10 },
    maxFileSize: 150, // 150 KB
    supportedFormats: ['jpg', 'png', 'gif'],
    maxCaptionLength: 50,
    maxHashtags: 0,
    recommendations: [
      'Standard leaderboard (728x90)',
      'Also available: 300x250, 160x600, 300x600',
      'File size: max 150 KB',
      'Clear call-to-action',
      'High contrast colors',
      'Test multiple variations',
    ],
  },
};

/**
 * Get format by ID
 */
export function getFormat(formatId: string): PlatformFormat | undefined {
  return PLATFORM_FORMATS[formatId];
}

/**
 * Get all available formats
 */
export function getAllFormats(): PlatformFormat[] {
  return Object.values(PLATFORM_FORMATS);
}

/**
 * Convert dimensions to another format
 */
export function convertDimensions(
  sourceFormat: PlatformFormat,
  targetFormat: PlatformFormat,
  sourceWidth: number,
  sourceHeight: number
): { width: number; height: number } {
  const targetAspectRatio = targetFormat.dimensions.width / targetFormat.dimensions.height;
  const sourceAspectRatio = sourceWidth / sourceHeight;

  let width = targetFormat.dimensions.width;
  let height = targetFormat.dimensions.height;

  if (sourceAspectRatio > targetAspectRatio) {
    // Source is wider, fit to target height
    height = targetFormat.dimensions.height;
    width = Math.round(height * sourceAspectRatio);
  } else {
    // Source is taller, fit to target width
    width = targetFormat.dimensions.width;
    height = Math.round(width / sourceAspectRatio);
  }

  return { width, height };
}

/**
 * Get recommended export settings for a platform
 */
export function getExportSettings(formatId: string) {
  const format = getFormat(formatId);
  if (!format) return null;

  return {
    dimensions: format.dimensions,
    quality: 95,
    format: format.supportedFormats[0],
    maxFileSize: format.maxFileSize,
  };
}
