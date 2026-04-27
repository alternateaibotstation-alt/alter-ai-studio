import { supabase } from "@/integrations/supabase/client";
import type { AIRequest, AIResponse } from "./types";

export async function runAIRequest(request: AIRequest): Promise<AIResponse> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase.functions.invoke("ai-engine-v2", {
    body: request,
  });
  if (error) throw error;

  return {
    output: data?.output ?? data?.content ?? "",
    model: data?.model ?? request.model ?? "default",
    creditsUsed: Number(data?.creditsUsed ?? 0),
    requestId: data?.requestId ?? crypto.randomUUID(),
  };
}
