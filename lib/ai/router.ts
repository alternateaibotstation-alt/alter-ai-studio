export type UserTier = "free" | "starter" | "creator" | "pro" | "studio";
export type TaskType =
  | "text_generation"
  | "image_generation"
  | "voice_generation"
  | "video_generation"
  | "campaign_generation";

export interface RoutingContext {
  tier: UserTier;
  taskType: TaskType;
  preferHighQuality?: boolean;
}

export interface RouteResult {
  provider: "openai" | "google";
  model: string;
  reason: string;
}

export function routeAIRequest(context: RoutingContext): RouteResult {
  const { tier, taskType, preferHighQuality } = context;

  if (tier === "free") {
    return {
      provider: "google",
      model: "gemini-1.5-flash",
      reason: "Free tier: routing to Gemini for cost minimization.",
    };
  }

  if (tier === "starter") {
    return {
      provider: "google",
      model: "gemini-1.5-flash",
      reason: "Starter tier: using Gemini for standard tasks.",
    };
  }

  if (tier === "creator" || tier === "pro") {
    if (
      taskType === "video_generation" ||
      taskType === "image_generation" ||
      preferHighQuality
    ) {
      return {
        provider: "openai",
        model: "gpt-4o",
        reason: "Creator/Pro tier: using OpenAI for premium media generation.",
      };
    }
    return {
      provider: "google",
      model: "gemini-1.5-flash",
      reason: "Creator/Pro tier: using Gemini for text tasks.",
    };
  }

  if (tier === "studio") {
    if (taskType === "campaign_generation") {
      return {
        provider: "google",
        model: "gemini-1.5-flash",
        reason: "Studio tier: using Gemini for high-volume campaign generation.",
      };
    }
    return {
      provider: "openai",
      model: "gpt-4o",
      reason: "Studio tier: prioritizing OpenAI for premium output.",
    };
  }

  return {
    provider: "google",
    model: "gemini-1.5-flash",
    reason: "Default fallback: routing to Gemini.",
  };
}
