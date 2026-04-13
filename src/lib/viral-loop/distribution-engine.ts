/**
 * Viral Loop & Distribution System
 * Enables content to go viral with affiliate embedding and referral system
 */

export type ShareableContentType = 'text' | 'image' | 'video' | 'link' | 'social_post';
export type AffiliateType = 'product' | 'service' | 'template' | 'course' | 'custom';
export type ReferralStatus = 'pending' | 'active' | 'completed' | 'expired';

export interface ShareableOutput {
  id: string;
  userId: string;
  contentId: string;
  contentType: ShareableContentType;
  content: string;
  watermark: string;
  shareUrl: string;
  affiliateCode: string;
  expiresAt?: Date;
  views: number;
  clicks: number;
  conversions: number;
  createdAt: Date;
}

export interface AffiliateLink {
  id: string;
  userId: string;
  affiliateCode: string;
  affiliateType: AffiliateType;
  targetId: string;
  targetUrl: string;
  commission: number; // percentage
  clicks: number;
  conversions: number;
  revenue: number;
  isActive: boolean;
  createdAt: Date;
}

export interface ReferralProgram {
  id: string;
  userId: string;
  referralCode: string;
  referralUrl: string;
  referralsCount: number;
  conversionRate: number;
  totalReward: number;
  status: ReferralStatus;
  expiresAt?: Date;
  createdAt: Date;
}

export interface ReferralConversion {
  id: string;
  referralCode: string;
  referrerId: string;
  refereeId: string;
  rewardAmount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface CreatorProfile {
  id: string;
  userId: string;
  username: string;
  bio: string;
  avatar?: string;
  website?: string;
  socialLinks: Record<string, string>;
  followers: number;
  templates: number;
  earnings: number;
  isVerified: boolean;
  createdAt: Date;
}

/**
 * DistributionEngine - Manages viral distribution and affiliate embedding
 */
export class DistributionEngine {
  private supabase: any;
  private shareableOutputs: Map<string, ShareableOutput> = new Map();
  private affiliateLinks: Map<string, AffiliateLink> = new Map();

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  /**
   * Create shareable output with watermark
   */
  async createShareableOutput(
    userId: string,
    contentId: string,
    contentType: ShareableContentType,
    content: string
  ): Promise<ShareableOutput> {
    const outputId = this.generateOutputId();
    const affiliateCode = this.generateAffiliateCode(userId);
    const watermark = this.generateWatermark(userId);
    const shareUrl = `${Deno.env.get('VITE_APP_URL')}/share/${outputId}?ref=${affiliateCode}`;

    const output: ShareableOutput = {
      id: outputId,
      userId,
      contentId,
      contentType,
      content: this.embedWatermark(content, watermark),
      watermark,
      shareUrl,
      affiliateCode,
      views: 0,
      clicks: 0,
      conversions: 0,
      createdAt: new Date(),
    };

    // Save to database
    const { error } = await this.supabase.from('shareable_outputs').insert({
      id: outputId,
      user_id: userId,
      content_id: contentId,
      content_type: contentType,
      content: output.content,
      watermark,
      share_url: shareUrl,
      affiliate_code: affiliateCode,
      views: 0,
      clicks: 0,
      conversions: 0,
      created_at: output.createdAt.toISOString(),
    });

    if (error) throw error;

    this.shareableOutputs.set(outputId, output);
    return output;
  }

  /**
   * Track share view
   */
  async trackView(outputId: string): Promise<void> {
    const { error } = await this.supabase.rpc('increment_share_views', {
      p_output_id: outputId,
    });

    if (error) console.error('Error tracking view:', error);
  }

  /**
   * Track affiliate click
   */
  async trackAffiliateClick(affiliateCode: string): Promise<void> {
    const { error } = await this.supabase.rpc('increment_affiliate_clicks', {
      p_affiliate_code: affiliateCode,
    });

    if (error) console.error('Error tracking click:', error);
  }

  /**
   * Create affiliate link
   */
  async createAffiliateLink(
    userId: string,
    affiliateType: AffiliateType,
    targetId: string,
    targetUrl: string,
    commission: number = 10
  ): Promise<AffiliateLink> {
    const affiliateCode = this.generateAffiliateCode(userId);
    const linkId = `aff_${affiliateCode}`;

    const link: AffiliateLink = {
      id: linkId,
      userId,
      affiliateCode,
      affiliateType,
      targetId,
      targetUrl: `${targetUrl}?ref=${affiliateCode}`,
      commission,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      isActive: true,
      createdAt: new Date(),
    };

    const { error } = await this.supabase.from('affiliate_links').insert({
      id: linkId,
      user_id: userId,
      affiliate_code: affiliateCode,
      affiliate_type: affiliateType,
      target_id: targetId,
      target_url: link.targetUrl,
      commission,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      is_active: true,
      created_at: link.createdAt.toISOString(),
    });

    if (error) throw error;

    this.affiliateLinks.set(affiliateCode, link);
    return link;
  }

  /**
   * Record affiliate conversion
   */
  async recordAffiliateConversion(
    affiliateCode: string,
    saleAmount: number
  ): Promise<void> {
    const link = this.affiliateLinks.get(affiliateCode);
    if (!link) return;

    const commission = (saleAmount * link.commission) / 100;

    // Update affiliate link stats
    const { error: updateError } = await this.supabase
      .from('affiliate_links')
      .update({
        conversions: link.conversions + 1,
        revenue: link.revenue + commission,
      })
      .eq('affiliate_code', affiliateCode);

    if (updateError) console.error('Error updating affiliate:', updateError);

    // Record conversion
    const { error: recordError } = await this.supabase.from('affiliate_conversions').insert({
      affiliate_code: affiliateCode,
      user_id: link.userId,
      sale_amount: saleAmount,
      commission,
      recorded_at: new Date().toISOString(),
    });

    if (recordError) console.error('Error recording conversion:', recordError);
  }

  /**
   * Create referral program
   */
  async createReferralProgram(userId: string): Promise<ReferralProgram> {
    const referralCode = this.generateReferralCode();
    const programId = `ref_${referralCode}`;
    const referralUrl = `${Deno.env.get('VITE_APP_URL')}/join?ref=${referralCode}`;

    const program: ReferralProgram = {
      id: programId,
      userId,
      referralCode,
      referralUrl,
      referralsCount: 0,
      conversionRate: 0,
      totalReward: 0,
      status: 'active',
      createdAt: new Date(),
    };

    const { error } = await this.supabase.from('referral_programs').insert({
      id: programId,
      user_id: userId,
      referral_code: referralCode,
      referral_url: referralUrl,
      referrals_count: 0,
      conversion_rate: 0,
      total_reward: 0,
      status: 'active',
      created_at: program.createdAt.toISOString(),
    });

    if (error) throw error;

    return program;
  }

  /**
   * Track referral conversion
   */
  async trackReferralConversion(
    referralCode: string,
    refereeId: string,
    rewardAmount: number
  ): Promise<ReferralConversion> {
    const conversionId = `conv_${referralCode}_${refereeId}`;

    const conversion: ReferralConversion = {
      id: conversionId,
      referralCode,
      referrerId: '', // Will be set from database
      refereeId,
      rewardAmount,
      status: 'completed',
      createdAt: new Date(),
      completedAt: new Date(),
    };

    // Get referrer ID
    const { data: program } = await this.supabase
      .from('referral_programs')
      .select('user_id')
      .eq('referral_code', referralCode)
      .single();

    if (!program) throw new Error('Referral code not found');

    conversion.referrerId = program.user_id;

    // Record conversion
    const { error: recordError } = await this.supabase.from('referral_conversions').insert({
      id: conversionId,
      referral_code: referralCode,
      referrer_id: program.user_id,
      referee_id: refereeId,
      reward_amount: rewardAmount,
      status: 'completed',
      created_at: conversion.createdAt.toISOString(),
      completed_at: conversion.completedAt?.toISOString(),
    });

    if (recordError) throw recordError;

    // Update referral program stats
    await this.supabase.rpc('increment_referral_count', {
      p_referral_code: referralCode,
      p_reward_amount: rewardAmount,
    });

    return conversion;
  }

  /**
   * Get creator profile
   */
  async getCreatorProfile(userId: string): Promise<CreatorProfile> {
    const { data, error } = await this.supabase
      .from('creator_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Create default profile
      return this.createCreatorProfile(userId);
    }

    return {
      id: data.id,
      userId: data.user_id,
      username: data.username,
      bio: data.bio,
      avatar: data.avatar,
      website: data.website,
      socialLinks: data.social_links || {},
      followers: data.followers || 0,
      templates: data.templates || 0,
      earnings: data.earnings || 0,
      isVerified: data.is_verified || false,
      createdAt: new Date(data.created_at),
    };
  }

  /**
   * Create creator profile
   */
  private async createCreatorProfile(userId: string): Promise<CreatorProfile> {
    const profileId = `profile_${userId}`;

    const profile: CreatorProfile = {
      id: profileId,
      userId,
      username: `creator_${userId.substring(0, 8)}`,
      bio: '',
      followers: 0,
      templates: 0,
      earnings: 0,
      isVerified: false,
      createdAt: new Date(),
    };

    await this.supabase.from('creator_profiles').insert({
      id: profileId,
      user_id: userId,
      username: profile.username,
      bio: '',
      followers: 0,
      templates: 0,
      earnings: 0,
      is_verified: false,
      created_at: profile.createdAt.toISOString(),
    });

    return profile;
  }

  /**
   * Update creator profile
   */
  async updateCreatorProfile(userId: string, updates: Partial<CreatorProfile>): Promise<CreatorProfile> {
    const { error } = await this.supabase
      .from('creator_profiles')
      .update({
        username: updates.username,
        bio: updates.bio,
        avatar: updates.avatar,
        website: updates.website,
        social_links: updates.socialLinks,
      })
      .eq('user_id', userId);

    if (error) throw error;

    return this.getCreatorProfile(userId);
  }

  /**
   * Get shareable output
   */
  async getShareableOutput(outputId: string): Promise<ShareableOutput | null> {
    const { data, error } = await this.supabase
      .from('shareable_outputs')
      .select('*')
      .eq('id', outputId)
      .single();

    if (error) return null;

    return {
      id: data.id,
      userId: data.user_id,
      contentId: data.content_id,
      contentType: data.content_type,
      content: data.content,
      watermark: data.watermark,
      shareUrl: data.share_url,
      affiliateCode: data.affiliate_code,
      views: data.views,
      clicks: data.clicks,
      conversions: data.conversions,
      createdAt: new Date(data.created_at),
    };
  }

  /**
   * Generate watermark
   */
  private generateWatermark(userId: string): string {
    return `Created with Alter AI | ${userId.substring(0, 8)}`;
  }

  /**
   * Embed watermark in content
   */
  private embedWatermark(content: string, watermark: string): string {
    return `${content}\n\n---\n${watermark}`;
  }

  /**
   * Generate affiliate code
   */
  private generateAffiliateCode(userId: string): string {
    return `aff_${userId.substring(0, 8)}_${Date.now().toString(36)}`;
  }

  /**
   * Generate referral code
   */
  private generateReferralCode(): string {
    return `ref_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate output ID
   */
  private generateOutputId(): string {
    return `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * ViralMetrics - Tracks viral metrics and growth
 */
export class ViralMetrics {
  private supabase: any;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  /**
   * Get viral metrics for content
   */
  async getContentMetrics(contentId: string): Promise<Record<string, any>> {
    const { data, error } = await this.supabase
      .from('shareable_outputs')
      .select('views, clicks, conversions')
      .eq('content_id', contentId);

    if (error) return {};

    const totals = {
      totalViews: 0,
      totalClicks: 0,
      totalConversions: 0,
      ctr: 0, // Click-through rate
      conversionRate: 0,
    };

    for (const item of data || []) {
      totals.totalViews += item.views || 0;
      totals.totalClicks += item.clicks || 0;
      totals.totalConversions += item.conversions || 0;
    }

    totals.ctr = totals.totalViews > 0 ? (totals.totalClicks / totals.totalViews) * 100 : 0;
    totals.conversionRate = totals.totalClicks > 0 ? (totals.totalConversions / totals.totalClicks) * 100 : 0;

    return totals;
  }

  /**
   * Get affiliate metrics
   */
  async getAffiliateMetrics(userId: string): Promise<Record<string, any>> {
    const { data, error } = await this.supabase
      .from('affiliate_links')
      .select('clicks, conversions, revenue')
      .eq('user_id', userId);

    if (error) return {};

    const totals = {
      totalClicks: 0,
      totalConversions: 0,
      totalRevenue: 0,
      conversionRate: 0,
      avgCommissionPerConversion: 0,
    };

    for (const item of data || []) {
      totals.totalClicks += item.clicks || 0;
      totals.totalConversions += item.conversions || 0;
      totals.totalRevenue += item.revenue || 0;
    }

    totals.conversionRate = totals.totalClicks > 0 ? (totals.totalConversions / totals.totalClicks) * 100 : 0;
    totals.avgCommissionPerConversion = totals.totalConversions > 0 ? totals.totalRevenue / totals.totalConversions : 0;

    return totals;
  }

  /**
   * Get referral metrics
   */
  async getReferralMetrics(userId: string): Promise<Record<string, any>> {
    const { data, error } = await this.supabase
      .from('referral_programs')
      .select('referrals_count, total_reward, conversion_rate')
      .eq('user_id', userId)
      .single();

    if (error) return {};

    return {
      referralsCount: data?.referrals_count || 0,
      totalReward: data?.total_reward || 0,
      conversionRate: data?.conversion_rate || 0,
    };
  }
}
