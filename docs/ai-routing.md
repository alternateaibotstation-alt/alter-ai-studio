# AI Cost-Routing & Profit System

This document outlines the intelligent routing and profit system implemented in ONE-Stop to optimize AI model usage, manage costs, and ensure profitability.

## 1. Smart Routing Between Gemini and OpenAI

ONE-Stop leverages a hybrid approach, dynamically routing AI requests between Google Gemini and OpenAI models based on user tier, task type, and cost considerations. This strategy aims to maximize efficiency and cost-effectiveness without compromising on quality for critical tasks.

### 1.1. Routing Rules

The following rules govern how AI requests are routed:

*   **Free Users:** All AI requests from free-tier users are exclusively routed to **Google Gemini**. Gemini offers a more cost-effective solution for high-volume, general-purpose tasks, aligning with the free-tier's operational cost minimization strategy.
*   **Pro Users:** Requests from Pro-tier users utilize a **hybrid routing** approach. The system intelligently balances between Gemini and OpenAI, prioritizing cost-efficiency for bulk tasks and leveraging OpenAI for tasks requiring higher quality or specific capabilities.
*   **Power Users:** For Power-tier users, **OpenAI is prioritized**. This ensures access to the most advanced and capable models for premium outputs. Gemini serves as a fallback or for specific bulk tasks where its cost-effectiveness is beneficial.
*   **Emotional/Conversational Tasks:** Tasks involving nuanced emotional understanding, complex reasoning, or highly conversational interactions are primarily routed to **OpenAI**. These models generally excel in generating more human-like and contextually appropriate responses.
*   **Bulk Content Generation:** Tasks such as generating large volumes of text, image variations, or video scripts are optimized for **Google Gemini**. Gemini's efficiency in handling high-throughput requests makes it ideal for these scenarios, contributing to overall cost savings.

### 1.2. Pseudocode for Request Routing

```typescript
function routeRequest(user: User, task: Task, modelPreferences: ModelPreferences): AIModel {
  // Check for BYO API Key first
  if (user.hasOpenAIKey && modelPreferences.preferOpenAI) {
    return OpenAI_BYO_KEY;
  }
  if (user.hasGeminiKey && modelPreferences.preferGemini) {
    return Gemini_BYO_KEY;
  }

  // Tier-based routing
  switch (user.tier) {
    case 'free':
      return Gemini_Default;
    case 'pro':
      if (task.type === 'emotional_conversation' || modelPreferences.requireHighQuality) {
        return OpenAI_Default;
      } else if (task.type === 'bulk_generation' || modelPreferences.preferCostEfficiency) {
        return Gemini_Default;
      } else {
        // Default to a balanced approach or cheaper model if not specified
        return Gemini_Default; 
      }
    case 'power':
      if (task.type === 'bulk_generation' || modelPreferences.preferCostEfficiency) {
        return Gemini_Default;
      } else {
        return OpenAI_Default; // Power users prioritize OpenAI
      }
    default:
      return Gemini_Default; // Fallback for undefined tiers
  }
}

// Example ModelPreferences interface
interface ModelPreferences {
  preferOpenAI?: boolean;
  preferGemini?: boolean;
  requireHighQuality?: boolean;
  preferCostEfficiency?: boolean;
}
```

### 1.3. Text-Based Architecture Diagram

```
[User Request] --(API Gateway)--> [Supabase Edge Function (Router)]
                                      |
                                      |-- Check User Tier & BYO Key
                                      |-- Evaluate Task Type (e.g., Chat, Image Gen, Bulk Content)
                                      |
                                      |--[Routing Logic]--
                                      |
                                      |--> [Google Gemini API] (Free, Pro, Bulk Tasks)
                                      |--> [OpenAI API] (Pro, Power, Emotional/Conversational Tasks)
                                      |--> [User's BYO OpenAI Key] (If provided)
                                      |--> [User's BYO Gemini Key] (If provided)
                                      |
                                      |-- (Cost Tracking & Credit Deduction)
                                      |
                                      v
                                  [Response to User]
```

## 2. Cost Tracking and Profit Calculation

Accurate cost tracking and a robust profit calculation mechanism are central to ONE-Stop's financial sustainability.

### 2.1. Tracking Metrics

For every AI request, the following metrics are tracked:

*   **Tokens Used:** The number of input and output tokens processed by the AI model.
*   **API Cost:** The actual cost incurred from the respective AI provider (OpenAI, Google Gemini) for the request.
*   **Model Used:** Identification of the specific AI model (e.g., `gpt-4`, `gemini-pro`) that fulfilled the request.
*   **User Tier:** The subscription tier of the user making the request.
*   **BYO Key Usage:** A flag indicating whether the user's own API key was utilized.

### 2.2. Profit Calculation

ONE-Stop aims for a **minimum 18% profit margin** on all AI-driven services. This is achieved through a dynamic markup system:

`Credit_Cost_to_User = API_Cost * (1 + Base_Markup_Percentage + Tier_Specific_Markup_Percentage)`

*   **Base Markup Percentage:** A foundational markup applied to all requests.
*   **Tier-Specific Markup Percentage:** An additional markup that varies by user tier. For instance, free users might have a higher effective markup (via credit pricing) to cover operational costs, while power users might have a lower markup due to their subscription fees.
*   **BYO API Key Scenario:** When a user provides their own API key, the platform's `API_Cost` for that request is effectively $0. The user is then only charged for the platform's service fee (if any) or it's considered part of their subscription benefits.

### 2.3. Credit System

All AI interactions within ONE-Stop consume credits. The credit system is designed as follows:

*   **Credit Consumption:** Each request, based on its complexity, model used, and token count, deducts a specific number of credits from the user's balance.
*   **Credit Pricing:** Credits are priced above their underlying API cost, incorporating the calculated profit margin.
*   **Credit Bundles/Subscriptions:** Users can purchase credit bundles or subscribe to tiers that include a fixed allocation of credits.

## 3. Failsafes and Throttling

To ensure platform stability, prevent abuse, and manage costs, several failsafe mechanisms are in place:

*   **Credit Exhaustion Block:** Requests are automatically blocked if a user's credit balance is insufficient to cover the cost of the requested operation.
*   **Excessive Usage Throttling:** The system monitors user request rates and throttles excessive usage to prevent API abuse, manage load, and protect against unexpected cost spikes.
*   **Fallback to Cheaper Model:** In scenarios where the primary model is unavailable, experiencing high latency, or exceeding predefined cost thresholds, the system can automatically fall back to a cheaper, alternative model (e.g., from OpenAI to Gemini) to ensure service continuity and cost control.

This comprehensive system ensures that ONE-Stop remains profitable, scalable, and provides a seamless experience for users across all tiers.
