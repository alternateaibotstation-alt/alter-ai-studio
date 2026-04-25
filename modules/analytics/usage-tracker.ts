import { supabase } from "@/integrations/supabase/client";

export interface UsageEvent {
  tool: string;
  creditsUsed: number;
  estimatedCostUsd: number;
  plan: string;
  metadata?: Record<string, unknown>;
}

export async function trackUsageEvent(event: UsageEvent) {
  return supabase.functions.invoke("usage-tracking", {
    body: {
      action: "record",
      resourceType: event.tool,
      amount: event.creditsUsed,
      metadata: {
        estimatedCostUsd: event.estimatedCostUsd,
        plan: event.plan,
        ...event.metadata,
      },
    },
  });
}

export async function getUsageBreakdown() {
  const { data, error } = await supabase.functions.invoke("usage-tracking", {
    body: { action: "breakdown" },
  });
  if (error) throw error;
  return data?.result;
}
