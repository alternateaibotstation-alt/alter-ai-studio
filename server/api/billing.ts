import { validateCredits, deductAndLogUsage, getCreditBalance } from "../../modules/billing/credit-guard";
import { SAAS_PLANS } from "../../modules/billing/plans";

export const billingEndpoint = {
  plans: SAAS_PLANS,
  balance: getCreditBalance,
  validate: validateCredits,
  deduct: deductAndLogUsage,
};
