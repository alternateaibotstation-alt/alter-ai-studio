import { supabase } from "@/integrations/supabase/client";
import { type BillableAction, getActionCreditCost } from "./plans";

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
  return Math.max(0, Number(data?.result?.credits?.balance ?? data?.result?.remainingCredits ?? 0));
}

export async function validateCredits(action: BillableAction, quantity = 1): Promise<CreditValidationResult> {
  const creditsRequired = getActionCreditCost(action, quantity);
  const { data, error } = await supabase.functions.invoke("usage-tracking", {
    body: { action: "check", resourceType: action, amount: creditsRequired },
  });

  if (error) {
    return { allowed: false, creditsRequired, balance: 0, reason: error.message };
  }

  return {
    allowed: data?.result?.allowed === true,
    creditsRequired,
    balance: Number(data?.result?.balance ?? 0),
    reason: data?.result?.reason,
  };
}

export async function deductAndLogUsage(action: BillableAction, quantity = 1) {
  const amount = getActionCreditCost(action, quantity);
  const { data, error } = await supabase.functions.invoke("usage-tracking", {
    body: { action: "record", resourceType: action, amount },
  });
  if (error) throw error;
  return data?.result;
}
