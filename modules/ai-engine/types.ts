import type { BillableAction } from "../billing/plans";

export interface AIRequest {
  prompt: string;
  model?: string;
  action: BillableAction;
  systemPrompt?: string;
  metadata?: Record<string, unknown>;
}

export interface AIResponse<T = string> {
  output: T;
  model: string;
  creditsUsed: number;
  requestId: string;
}
