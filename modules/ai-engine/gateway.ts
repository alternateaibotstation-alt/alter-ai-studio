import { supabase } from "@/integrations/supabase/client";
import { validateCredits, deductAndLogUsage } from "../billing/credit-guard";
import type { AIRequest, AIResponse } from "./types";

export async function runAIRequest(request: AIRequest): Promise<AIResponse> {
  const validation = await validateCredits(request.action);
  if (!validation.allowed) {
    throw new Error(validation.reason || "Not enough credits for this AI request");
  }

  const { data, error } = await supabase.functions.invoke("ai-engine-v2", {
    body: request,
  });
  if (error) throw error;

  await deductAndLogUsage(request.action);

  return {
    output: data?.output ?? data?.content ?? "",
    model: data?.model ?? request.model ?? "default",
    creditsUsed: validation.creditsRequired,
    requestId: data?.requestId ?? crypto.randomUUID(),
  };
}
