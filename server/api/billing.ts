import { reserveCredits, deductCredits, getCreditBalance, SAAS_PLANS } from "@modules/billing";

export const billingEndpoint = {
  plans: SAAS_PLANS,
  balance: getCreditBalance,
  reserve: reserveCredits,
  deduct: deductCredits,
};
