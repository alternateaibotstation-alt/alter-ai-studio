/**
 * Usage Tracking and Monetization System
 * Tracks token usage, API costs, and enforces plan limits
 */

export type SubscriptionTier = 'free' | 'pro' | 'power' | 'enterprise';
export type ResourceType = 'messages' | 'images' | 'videos' | 'audio' | 'tokens' | 'api_calls';

export interface PlanLimits {
  tier: SubscriptionTier;
  monthlyLimit: number;
  dailyLimit: number;
  requestsPerMinute: number;
  features: string[];
  maxTokensPerRequest: number;
  prioritySupport: boolean;
  customModels: boolean;
}

export interface UsageRecord {
  id: string;
  userId: string;
  resourceType: ResourceType;
  amount: number;
  cost: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface UserUsageStats {
  userId: string;
  tier: SubscriptionTier;
  monthlyUsage: Record<ResourceType, number>;
  dailyUsage: Record<ResourceType, number>;
  monthlyCost: number;
  dailyCost: number;
  monthlyLimit: number;
  percentageUsed: number;
  resetDate: Date;
}

export interface CostCalculation {
  resourceType: ResourceType;
  amount: number;
  unitCost: number;
  totalCost: number;
  estimatedMonthlyImpact: number;
}

/**
 * Plan definitions
 */
export const PLAN_DEFINITIONS: Record<SubscriptionTier, PlanLimits> = {
  free: {
    tier: 'free',
    monthlyLimit: 10000, // tokens
    dailyLimit: 500,
    requestsPerMinute: 10,
    features: ['basic_chat', 'limited_content_generation'],
    maxTokensPerRequest: 1000,
    prioritySupport: false,
    customModels: false,
  },
  pro: {
    tier: 'pro',
    monthlyLimit: 500000,
    dailyLimit: 20000,
    requestsPerMinute: 100,
    features: [
      'unlimited_chat',
      'content_generation',
      'image_generation',
      'batch_processing',
      'api_access',
    ],
    maxTokensPerRequest: 4000,
    prioritySupport: true,
    customModels: false,
  },
  power: {
    tier: 'power',
    monthlyLimit: Infinity,
    dailyLimit: Infinity,
    requestsPerMinute: 1000,
    features: [
      'unlimited_everything',
      'video_generation',
      'audio_generation',
      'custom_models',
      'webhook_integration',
      'advanced_analytics',
    ],
    maxTokensPerRequest: 8000,
    prioritySupport: true,
    customModels: true,
  },
  enterprise: {
    tier: 'enterprise',
    monthlyLimit: Infinity,
    dailyLimit: Infinity,
    requestsPerMinute: Infinity,
    features: [
      'everything',
      'dedicated_support',
      'custom_integration',
      'sso',
      'advanced_security',
    ],
    maxTokensPerRequest: 16000,
    prioritySupport: true,
    customModels: true,
  },
};

/**
 * Cost configuration (per unit)
 */
export const COST_CONFIG: Record<ResourceType, number> = {
  messages: 0.0001, // $0.0001 per message
  images: 0.001, // $0.001 per image
  videos: 0.01, // $0.01 per video
  audio: 0.0005, // $0.0005 per audio
  tokens: 0.000001, // $0.000001 per token
  api_calls: 0.00001, // $0.00001 per API call
};

/**
 * UsageTracker - Tracks and enforces usage limits
 */
export class UsageTracker {
  private supabase: any;
  private usageCache: Map<string, UserUsageStats> = new Map();
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes
  private cacheTimestamps: Map<string, number> = new Map();

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  /**
   * Record usage
   */
  async recordUsage(
    userId: string,
    resourceType: ResourceType,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<UsageRecord> {
    const cost = this.calculateCost(resourceType, amount);

    const { data, error } = await this.supabase
      .from('usage_records')
      .insert({
        user_id: userId,
        resource_type: resourceType,
        amount,
        cost,
        metadata: metadata || {},
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Invalidate cache
    this.usageCache.delete(userId);
    this.cacheTimestamps.delete(userId);

    return {
      id: data.id,
      userId: data.user_id,
      resourceType: data.resource_type,
      amount: data.amount,
      cost: data.cost,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
    };
  }

  /**
   * Get user usage stats
   */
  async getUserUsageStats(userId: string): Promise<UserUsageStats> {
    // Check cache
    const cached = this.usageCache.get(userId);
    const cacheTime = this.cacheTimestamps.get(userId) || 0;

    if (cached && Date.now() - cacheTime < this.cacheDuration) {
      return cached;
    }

    // Get user tier
    const tier = await this.getUserTier(userId);
    const planLimits = PLAN_DEFINITIONS[tier];

    // Get monthly usage
    const monthlyUsage = await this.getMonthlyUsage(userId);
    const dailyUsage = await this.getDailyUsage(userId);

    // Calculate costs
    let monthlyCost = 0;
    let dailyCost = 0;

    for (const [resourceType, amount] of Object.entries(monthlyUsage)) {
      monthlyCost += this.calculateCost(resourceType as ResourceType, amount);
    }

    for (const [resourceType, amount] of Object.entries(dailyUsage)) {
      dailyCost += this.calculateCost(resourceType as ResourceType, amount);
    }

    const monthlyTokenUsage = monthlyUsage.tokens || 0;
    const percentageUsed = (monthlyTokenUsage / planLimits.monthlyLimit) * 100;

    const resetDate = new Date();
    resetDate.setDate(resetDate.getDate() + 1);
    resetDate.setHours(0, 0, 0, 0);

    const stats: UserUsageStats = {
      userId,
      tier,
      monthlyUsage: monthlyUsage as Record<ResourceType, number>,
      dailyUsage: dailyUsage as Record<ResourceType, number>,
      monthlyCost,
      dailyCost,
      monthlyLimit: planLimits.monthlyLimit,
      percentageUsed,
      resetDate,
    };

    // Cache the stats
    this.usageCache.set(userId, stats);
    this.cacheTimestamps.set(userId, Date.now());

    return stats;
  }

  /**
   * Check if user can perform action
   */
  async canPerformAction(
    userId: string,
    resourceType: ResourceType,
    amount: number = 1
  ): Promise<{ allowed: boolean; reason?: string }> {
    const tier = await this.getUserTier(userId);
    const planLimits = PLAN_DEFINITIONS[tier];
    const stats = await this.getUserUsageStats(userId);

    // Check monthly limit
    if (planLimits.monthlyLimit !== Infinity) {
      const projectedUsage = stats.monthlyUsage[resourceType] + amount;
      if (projectedUsage > planLimits.monthlyLimit) {
        return {
          allowed: false,
          reason: `Monthly limit exceeded for ${resourceType}`,
        };
      }
    }

    // Check daily limit
    if (planLimits.dailyLimit !== Infinity) {
      const projectedDailyUsage = stats.dailyUsage[resourceType] + amount;
      if (projectedDailyUsage > planLimits.dailyLimit) {
        return {
          allowed: false,
          reason: `Daily limit exceeded for ${resourceType}`,
        };
      }
    }

    // Check requests per minute (simplified)
    const recentRequests = await this.getRecentRequestCount(userId, 60000); // Last minute
    if (recentRequests >= planLimits.requestsPerMinute) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded',
      };
    }

    return { allowed: true };
  }

  /**
   * Check if feature is available for tier
   */
  async hasFeature(userId: string, feature: string): Promise<boolean> {
    const tier = await this.getUserTier(userId);
    const planLimits = PLAN_DEFINITIONS[tier];
    return planLimits.features.includes(feature);
  }

  /**
   * Get monthly usage
   */
  private async getMonthlyUsage(userId: string): Promise<Record<string, number>> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await this.supabase
      .from('usage_records')
      .select('resource_type, amount')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (error) return {};

    const usage: Record<string, number> = {};
    for (const record of data || []) {
      usage[record.resource_type] = (usage[record.resource_type] || 0) + record.amount;
    }

    return usage;
  }

  /**
   * Get daily usage
   */
  private async getDailyUsage(userId: string): Promise<Record<string, number>> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data, error } = await this.supabase
      .from('usage_records')
      .select('resource_type, amount')
      .eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString());

    if (error) return {};

    const usage: Record<string, number> = {};
    for (const record of data || []) {
      usage[record.resource_type] = (usage[record.resource_type] || 0) + record.amount;
    }

    return usage;
  }

  /**
   * Get recent request count
   */
  private async getRecentRequestCount(userId: string, timeWindowMs: number): Promise<number> {
    const since = new Date(Date.now() - timeWindowMs);

    const { data, error } = await this.supabase
      .from('usage_records')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', since.toISOString());

    if (error) return 0;

    return data?.length || 0;
  }

  /**
   * Get user tier
   */
  private async getUserTier(userId: string): Promise<SubscriptionTier> {
    // This will be fetched from Stripe or database
    // For now, returning free tier
    return 'free';
  }

  /**
   * Calculate cost
   */
  private calculateCost(resourceType: ResourceType, amount: number): number {
    const unitCost = COST_CONFIG[resourceType] || 0;
    return unitCost * amount;
  }

  /**
   * Clear cache
   */
  clearCache(userId?: string): void {
    if (userId) {
      this.usageCache.delete(userId);
      this.cacheTimestamps.delete(userId);
    } else {
      this.usageCache.clear();
      this.cacheTimestamps.clear();
    }
  }
}

/**
 * FeatureGate - Controls feature access based on tier
 */
export class FeatureGate {
  private usageTracker: UsageTracker;

  constructor(usageTracker: UsageTracker) {
    this.usageTracker = usageTracker;
  }

  /**
   * Check if feature is accessible
   */
  async isFeatureAccessible(userId: string, feature: string): Promise<boolean> {
    return this.usageTracker.hasFeature(userId, feature);
  }

  /**
   * Get accessible features for user
   */
  async getAccessibleFeatures(userId: string): Promise<string[]> {
    // Implementation would fetch from database
    return [];
  }

  /**
   * Enforce feature gate
   */
  async enforceFeatureGate(userId: string, feature: string): Promise<void> {
    const hasAccess = await this.isFeatureAccessible(userId, feature);
    if (!hasAccess) {
      throw new Error(`Feature '${feature}' is not available for this tier`);
    }
  }
}

/**
 * CostCalculator - Calculates costs and projections
 */
export class CostCalculator {
  /**
   * Calculate cost for resource usage
   */
  static calculateCost(resourceType: ResourceType, amount: number): CostCalculation {
    const unitCost = COST_CONFIG[resourceType] || 0;
    const totalCost = unitCost * amount;
    const estimatedMonthlyImpact = totalCost * 30; // Rough estimate

    return {
      resourceType,
      amount,
      unitCost,
      totalCost,
      estimatedMonthlyImpact,
    };
  }

  /**
   * Calculate total cost for multiple resources
   */
  static calculateTotalCost(usage: Record<ResourceType, number>): number {
    let total = 0;

    for (const [resourceType, amount] of Object.entries(usage)) {
      const calculation = this.calculateCost(resourceType as ResourceType, amount);
      total += calculation.totalCost;
    }

    return total;
  }

  /**
   * Get cost breakdown
   */
  static getCostBreakdown(usage: Record<ResourceType, number>): Record<ResourceType, number> {
    const breakdown: Record<ResourceType, number> = {} as any;

    for (const [resourceType, amount] of Object.entries(usage)) {
      const calculation = this.calculateCost(resourceType as ResourceType, amount);
      breakdown[resourceType as ResourceType] = calculation.totalCost;
    }

    return breakdown;
  }
}
