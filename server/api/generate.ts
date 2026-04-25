import { runAIRequest } from "../../modules/ai-engine/gateway";
import type { AIRequest } from "../../modules/ai-engine/types";

export async function generateEndpoint(request: AIRequest) {
  return runAIRequest(request);
}
