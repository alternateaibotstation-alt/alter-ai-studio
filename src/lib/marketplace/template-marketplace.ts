/**
 * Template Marketplace System
 * Enables creators to upload, sell, and monetize templates
 */

export type TemplateCategory = 'content' | 'email' | 'social' | 'landing' | 'sales' | 'video' | 'audio' | 'custom';
export type LicenseType = 'personal' | 'commercial' | 'resale' | 'unlimited';
export type TemplateStatus = 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected' | 'archived';

export interface Template {
  id: string;
  creatorId: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail?: string;
  content: Record<string, any>;
  version: string;
  status: TemplateStatus;
  price: number;
  licenseType: LicenseType;
  tags: string[];
  rating: number;
  reviewCount: number;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface TemplateVersion {
  id: string;
  templateId: string;
  version: string;
  content: Record<string, any>;
  changelog: string;
  createdAt: Date;
  createdBy: string;
}

export interface TemplateReview {
  id: string;
  templateId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  helpful: number;
  createdAt: Date;
}

export interface TemplateRevenueSplit {
  templateId: string;
  creatorShare: number; // percentage
  platformShare: number; // percentage
  affiliateShare: number; // percentage
  totalSales: number;
  creatorEarnings: number;
  platformEarnings: number;
  affiliateEarnings: number;
}

export interface TemplateLicense {
  id: string;
  templateId: string;
  buyerId: string;
  licenseType: LicenseType;
  purchasePrice: number;
  purchasedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface TemplateUpload {
  id: string;
  creatorId: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  uploadedAt: Date;
}

/**
 * TemplateMarketplace - Manages template uploads, sales, and distribution
 */
export class TemplateMarketplace {
  private supabase: any;
  private templates: Map<string, Template> = new Map();
  private versions: Map<string, TemplateVersion[]> = new Map();
  private reviews: Map<string, TemplateReview[]> = new Map();

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  /**
   * Upload template
   */
  async uploadTemplate(
    creatorId: string,
    templateData: {
      name: string;
      description: string;
      category: TemplateCategory;
      content: Record<string, any>;
      price: number;
      licenseType: LicenseType;
      tags: string[];
      thumbnail?: File;
    }
  ): Promise<Template> {
    const templateId = this.generateTemplateId();
    let thumbnailUrl: string | undefined;

    // Upload thumbnail if provided
    if (templateData.thumbnail) {
      thumbnailUrl = await this.uploadThumbnail(templateId, templateData.thumbnail);
    }

    const template: Template = {
      id: templateId,
      creatorId,
      name: templateData.name,
      description: templateData.description,
      category: templateData.category,
      thumbnail: thumbnailUrl,
      content: templateData.content,
      version: '1.0.0',
      status: 'pending_review',
      price: templateData.price,
      licenseType: templateData.licenseType,
      tags: templateData.tags,
      rating: 0,
      reviewCount: 0,
      downloadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database
    const { error } = await this.supabase.from('templates').insert({
      id: templateId,
      creator_id: creatorId,
      name: template.name,
      description: template.description,
      category: template.category,
      thumbnail: thumbnailUrl,
      content: template.content,
      version: template.version,
      status: template.status,
      price: template.price,
      license_type: template.licenseType,
      tags: template.tags,
      rating: 0,
      review_count: 0,
      download_count: 0,
      created_at: template.createdAt.toISOString(),
      updated_at: template.updatedAt.toISOString(),
    });

    if (error) throw error;

    this.templates.set(templateId, template);

    // Create initial version
    await this.createVersion(templateId, template.content, 'Initial version', creatorId);

    return template;
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<Template | null> {
    if (this.templates.has(templateId)) {
      return this.templates.get(templateId) || null;
    }

    const { data, error } = await this.supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) return null;

    const template = this.mapDbToTemplate(data);
    this.templates.set(templateId, template);
    return template;
  }

  /**
   * List templates by category
   */
  async listTemplatesByCategory(
    category: TemplateCategory,
    limit: number = 20,
    offset: number = 0
  ): Promise<Template[]> {
    const { data, error } = await this.supabase
      .from('templates')
      .select('*')
      .eq('category', category)
      .eq('status', 'published')
      .order('rating', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return [];

    return (data || []).map((t) => this.mapDbToTemplate(t));
  }

  /**
   * Search templates
   */
  async searchTemplates(query: string, limit: number = 20): Promise<Template[]> {
    const { data, error } = await this.supabase
      .from('templates')
      .select('*')
      .eq('status', 'published')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) return [];

    return (data || []).map((t) => this.mapDbToTemplate(t));
  }

  /**
   * Update template
   */
  async updateTemplate(templateId: string, updates: Partial<Template>): Promise<Template> {
    const template = await this.getTemplate(templateId);
    if (!template) throw new Error('Template not found');

    const updated = { ...template, ...updates, updatedAt: new Date() };

    const { error } = await this.supabase
      .from('templates')
      .update({
        name: updated.name,
        description: updated.description,
        price: updated.price,
        tags: updated.tags,
        updated_at: updated.updatedAt.toISOString(),
      })
      .eq('id', templateId);

    if (error) throw error;

    this.templates.set(templateId, updated);
    return updated;
  }

  /**
   * Publish template
   */
  async publishTemplate(templateId: string): Promise<Template> {
    const template = await this.getTemplate(templateId);
    if (!template) throw new Error('Template not found');

    const updated = {
      ...template,
      status: 'published' as TemplateStatus,
      publishedAt: new Date(),
      updatedAt: new Date(),
    };

    const { error } = await this.supabase
      .from('templates')
      .update({
        status: 'published',
        published_at: updated.publishedAt.toISOString(),
        updated_at: updated.updatedAt.toISOString(),
      })
      .eq('id', templateId);

    if (error) throw error;

    this.templates.set(templateId, updated);
    return updated;
  }

  /**
   * Create template version
   */
  async createVersion(
    templateId: string,
    content: Record<string, any>,
    changelog: string,
    createdBy: string
  ): Promise<TemplateVersion> {
    const template = await this.getTemplate(templateId);
    if (!template) throw new Error('Template not found');

    const versionNumber = this.incrementVersion(template.version);
    const versionId = `version_${templateId}_${versionNumber}`;

    const version: TemplateVersion = {
      id: versionId,
      templateId,
      version: versionNumber,
      content,
      changelog,
      createdAt: new Date(),
      createdBy,
    };

    const { error } = await this.supabase.from('template_versions').insert({
      id: versionId,
      template_id: templateId,
      version: versionNumber,
      content,
      changelog,
      created_at: version.createdAt.toISOString(),
      created_by: createdBy,
    });

    if (error) throw error;

    if (!this.versions.has(templateId)) {
      this.versions.set(templateId, []);
    }
    this.versions.get(templateId)!.push(version);

    // Update template version
    await this.updateTemplate(templateId, { version: versionNumber });

    return version;
  }

  /**
   * Get template versions
   */
  async getVersions(templateId: string): Promise<TemplateVersion[]> {
    if (this.versions.has(templateId)) {
      return this.versions.get(templateId) || [];
    }

    const { data, error } = await this.supabase
      .from('template_versions')
      .select('*')
      .eq('template_id', templateId)
      .order('created_at', { ascending: false });

    if (error) return [];

    const versions = (data || []).map((v) => ({
      id: v.id,
      templateId: v.template_id,
      version: v.version,
      content: v.content,
      changelog: v.changelog,
      createdAt: new Date(v.created_at),
      createdBy: v.created_by,
    }));

    this.versions.set(templateId, versions);
    return versions;
  }

  /**
   * Add review
   */
  async addReview(
    templateId: string,
    userId: string,
    rating: number,
    title: string,
    comment: string
  ): Promise<TemplateReview> {
    const reviewId = `review_${templateId}_${userId}`;

    const review: TemplateReview = {
      id: reviewId,
      templateId,
      userId,
      rating,
      title,
      comment,
      helpful: 0,
      createdAt: new Date(),
    };

    const { error } = await this.supabase.from('template_reviews').insert({
      id: reviewId,
      template_id: templateId,
      user_id: userId,
      rating,
      title,
      comment,
      helpful: 0,
      created_at: review.createdAt.toISOString(),
    });

    if (error) throw error;

    if (!this.reviews.has(templateId)) {
      this.reviews.set(templateId, []);
    }
    this.reviews.get(templateId)!.push(review);

    // Update template rating
    await this.updateTemplateRating(templateId);

    return review;
  }

  /**
   * Get reviews
   */
  async getReviews(templateId: string): Promise<TemplateReview[]> {
    if (this.reviews.has(templateId)) {
      return this.reviews.get(templateId) || [];
    }

    const { data, error } = await this.supabase
      .from('template_reviews')
      .select('*')
      .eq('template_id', templateId)
      .order('created_at', { ascending: false });

    if (error) return [];

    const reviews = (data || []).map((r) => ({
      id: r.id,
      templateId: r.template_id,
      userId: r.user_id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      helpful: r.helpful,
      createdAt: new Date(r.created_at),
    }));

    this.reviews.set(templateId, reviews);
    return reviews;
  }

  /**
   * Purchase template license
   */
  async purchaseLicense(
    templateId: string,
    buyerId: string,
    licenseType: LicenseType
  ): Promise<TemplateLicense> {
    const template = await this.getTemplate(templateId);
    if (!template) throw new Error('Template not found');

    const licenseId = `license_${templateId}_${buyerId}_${Date.now()}`;
    const expiresAt = licenseType === 'personal' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : undefined;

    const license: TemplateLicense = {
      id: licenseId,
      templateId,
      buyerId,
      licenseType,
      purchasePrice: template.price,
      purchasedAt: new Date(),
      expiresAt,
      isActive: true,
    };

    const { error } = await this.supabase.from('template_licenses').insert({
      id: licenseId,
      template_id: templateId,
      buyer_id: buyerId,
      license_type: licenseType,
      purchase_price: template.price,
      purchased_at: license.purchasedAt.toISOString(),
      expires_at: expiresAt?.toISOString(),
      is_active: true,
    });

    if (error) throw error;

    // Record revenue split
    await this.recordRevenueSplit(templateId, template.price);

    // Increment download count
    await this.incrementDownloadCount(templateId);

    return license;
  }

  /**
   * Record revenue split
   */
  private async recordRevenueSplit(templateId: string, saleAmount: number): Promise<void> {
    const creatorShare = 0.7; // 70% to creator
    const platformShare = 0.2; // 20% to platform
    const affiliateShare = 0.1; // 10% to affiliate

    const { error } = await this.supabase.from('template_revenue_splits').insert({
      template_id: templateId,
      creator_share: creatorShare,
      platform_share: platformShare,
      affiliate_share: affiliateShare,
      sale_amount: saleAmount,
      creator_earnings: saleAmount * creatorShare,
      platform_earnings: saleAmount * platformShare,
      affiliate_earnings: saleAmount * affiliateShare,
      recorded_at: new Date().toISOString(),
    });

    if (error) console.error('Error recording revenue split:', error);
  }

  /**
   * Update template rating
   */
  private async updateTemplateRating(templateId: string): Promise<void> {
    const reviews = await this.getReviews(templateId);
    if (reviews.length === 0) return;

    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    const { error } = await this.supabase
      .from('templates')
      .update({
        rating: averageRating,
        review_count: reviews.length,
      })
      .eq('id', templateId);

    if (error) console.error('Error updating rating:', error);

    const template = await this.getTemplate(templateId);
    if (template) {
      template.rating = averageRating;
      template.reviewCount = reviews.length;
      this.templates.set(templateId, template);
    }
  }

  /**
   * Increment download count
   */
  private async incrementDownloadCount(templateId: string): Promise<void> {
    const { error } = await this.supabase.rpc('increment_template_downloads', {
      p_template_id: templateId,
    });

    if (error) console.error('Error incrementing downloads:', error);
  }

  /**
   * Upload thumbnail
   */
  private async uploadThumbnail(templateId: string, file: File): Promise<string> {
    const fileName = `${templateId}_${Date.now()}.jpg`;
    const { data, error } = await this.supabase.storage
      .from('template-thumbnails')
      .upload(fileName, file);

    if (error) throw error;

    const { data: publicUrl } = this.supabase.storage
      .from('template-thumbnails')
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  }

  /**
   * Increment version number
   */
  private incrementVersion(version: string): string {
    const parts = version.split('.');
    parts[2] = String(parseInt(parts[2]) + 1);
    return parts.join('.');
  }

  /**
   * Generate template ID
   */
  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Map database record to Template
   */
  private mapDbToTemplate(data: any): Template {
    return {
      id: data.id,
      creatorId: data.creator_id,
      name: data.name,
      description: data.description,
      category: data.category,
      thumbnail: data.thumbnail,
      content: data.content,
      version: data.version,
      status: data.status,
      price: data.price,
      licenseType: data.license_type,
      tags: data.tags,
      rating: data.rating,
      reviewCount: data.review_count,
      downloadCount: data.download_count,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      publishedAt: data.published_at ? new Date(data.published_at) : undefined,
    };
  }
}
