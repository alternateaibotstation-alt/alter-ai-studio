import { supabase } from "@/integrations/supabase/client";
import { type BillableAction, getActionCreditCost, isVideoAllowed, type SaaSPlan } from "./plans";

export interface CreditValidationResult {
  allowed: boolean;
  creditsRequired: number;
  balance: number;
  reason?: string;
}

export async function getCreditBalance(): Promise<number> {
  const { data, error } = await supabase.functions.invoke("usage-tracking", {
    body: { action: "stats" },
  });
  if (error) return 0;
  return Math.max(
    0,
    Number(
      data?.result?.credits?.balance ?? data?.result?.remainingCredits ?? 0,
    ),
  );
}

export async function reserveCredits(
  action: BillableAction,
  quantity = 1,
  userPlan: SaaSPlan = "free",
): Promise<CreditValidationResult> {
  if (action === "video_generation" && !isVideoAllowed(userPlan)) {
    return {
      allowed: false,
      creditsRequired: getActionCreditCost(action, quantity),
      balance: 0,
      reason: "Video generation requires Pro plan or higher",
    };
  }

  const creditsRequired = getActionCreditCost(action, quantity);
  const { data, error } = await supabase.functions.invoke("usage-tracking", {
    body: { action: "check", resourceType: action, amount: creditsRequired },
  });

  if (error) {
    return {
      allowed: false,
      creditsRequired,
      balance: 0,
      reason: error.message,
    };
  }

  return {
    allowed: data?.result?.allowed === true,
    creditsRequired,
    balance: Number(data?.result?.balance ?? 0),
    reason: data?.result?.reason,
  };
}

export async function deductCredits(action: BillableAction, quantity = 1) {
  const amount = getActionCreditCost(action, quantity);
  const { data, error } = await supabase.functions.invoke("usage-tracking", {
    body: { action: "record", resourceType: action, amount },
  });
  if (error) throw error;
  return data?.result;
}

export async function refundCredits(action: BillableAction, quantity = 1) {
  const amount = getActionCreditCost(action, quantity);
  const { data, error } = await supabase.functions.invoke("usage-tracking", {
    body: { action: "refund", resourceType: action, amount },
  });
  if (error) throw error;
  return data?.result;
}
