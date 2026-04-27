import { runAIRequest, type AIRequest } from "@modules/ai-engine";

export async function generateEndpoint(request: AIRequest) {
  return runAIRequest(request);
}
