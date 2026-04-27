import { validateCredits, deductAndLogUsage, getCreditBalance, SAAS_PLANS } from "@modules/billing";

export const billingEndpoint = {
  plans: SAAS_PLANS,
  balance: getCreditBalance,
  validate: validateCredits,
  deduct: deductAndLogUsage,
};
