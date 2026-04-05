/**
 * ONE-Stop AI Routing System
 * 
 * This module implements the intelligent routing logic between Google Gemini and OpenAI.
 * It considers user tiers, task types, and cost-optimization strategies.
 */

export type UserTier = 'free' | 'pro' | 'power';
export type TaskType = 'chat' | 'emotional_chat' | 'bulk_content' | 'image_gen' | 'video_script';

export interface RoutingContext {
  tier: UserTier;
  taskType: TaskType;
  hasOpenAIKey: boolean;
  hasGeminiKey: boolean;
  preferHighQuality?: boolean;
}

export interface RouteResult {
  provider: 'openai' | 'google' | 'byo_openai' | 'byo_google';
  model: string;
  reason: string;
}

/**
 * Routes an AI request based on the provided context.
 */
export function routeAIRequest(context: RoutingContext): RouteResult {
  const { tier, taskType, hasOpenAIKey, hasGeminiKey, preferHighQuality } = context;

  // 1. Check for Bring Your Own Key (BYOK) - Highest Priority
  if (hasOpenAIKey && (preferHighQuality || taskType === 'emotional_chat')) {
    return {
      provider: 'byo_openai',
      model: 'gpt-4o',
      reason: 'Using user-provided OpenAI key for high-quality/emotional task.'
    };
  }

  if (hasGeminiKey && taskType === 'bulk_content') {
    return {
      provider: 'byo_google',
      model: 'gemini-1.5-flash',
      reason: 'Using user-provided Gemini key for bulk content task.'
    };
  }

  // 2. Tier-Based Routing Logic
  
  // FREE TIER: Always use Gemini for cost-efficiency
  if (tier === 'free') {
    return {
      provider: 'google',
      model: 'gemini-1.5-flash',
      reason: 'Free tier: routing to Gemini for cost minimization.'
    };
  }

  // PRO TIER: Hybrid routing
  if (tier === 'pro') {
    if (taskType === 'emotional_chat' || preferHighQuality) {
      return {
        provider: 'openai',
        model: 'gpt-4o-mini',
        reason: 'Pro tier: using OpenAI for high-quality/emotional task.'
      };
    }
    return {
      provider: 'google',
      model: 'gemini-1.5-flash',
      reason: 'Pro tier: using Gemini for standard/bulk tasks.'
    };
  }

  // POWER TIER: Prioritize OpenAI
  if (tier === 'power') {
    if (taskType === 'bulk_content') {
      return {
        provider: 'google',
        model: 'gemini-1.5-flash',
        reason: 'Power tier: using Gemini for high-volume bulk content.'
      };
    }
    return {
      provider: 'openai',
      model: 'gpt-4o',
      reason: 'Power tier: prioritizing OpenAI for premium output.'
    };
  }

  // Fallback
  return {
    provider: 'google',
    model: 'gemini-1.5-flash',
    reason: 'Default fallback: routing to Gemini.'
  };
}
