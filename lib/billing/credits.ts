/**
 * ONE-Stop Credit & Billing System
 * 
 * This module manages credit consumption, pricing, and profit calculation.
 * It ensures a minimum 18% profit margin on all AI services.
 */

export interface CreditConsumption {
  userId: string;
  creditsConsumed: number;
  apiCost: number;
  profit: number;
  margin: number;
}

/**
 * Calculates credit consumption based on API cost and user tier.
 * Ensures a minimum 18% profit margin.
 */
export function calculateCreditConsumption(
  apiCost: number,
  userTier: 'free' | 'pro' | 'power'
): CreditConsumption {
  // 1. Define profit margins by tier (minimum 18%)
  const marginByTier = {
    free: 0.30, // 30% margin for free users to cover platform costs
    pro: 0.22,  // 22% margin for pro users
    power: 0.18 // 18% minimum margin for power users
  };

  const margin = marginByTier[userTier] || 0.18;

  // 2. Calculate required revenue to meet the margin
  // Revenue = Cost / (1 - Margin)
  const requiredRevenue = apiCost / (1 - margin);

  // 3. Convert revenue to credits (e.g., $1 = 1000 credits)
  const creditsPerDollar = 1000;
  const creditsConsumed = Math.ceil(requiredRevenue * creditsPerDollar);

  // 4. Calculate actual profit and margin
  const actualRevenue = creditsConsumed / creditsPerDollar;
  const profit = actualRevenue - apiCost;
  const actualMargin = profit / actualRevenue;

  return {
    userId: 'dummy_id', // Placeholder
    creditsConsumed,
    apiCost,
    profit,
    margin: actualMargin
  };
}

/**
 * Checks if a user has enough credits for a requested operation.
 */
export function hasEnoughCredits(
  currentBalance: number,
  estimatedCost: number
): boolean {
  return currentBalance >= estimatedCost;
}
