import { getUsageBreakdown, trackUsageEvent } from "../../modules/analytics/usage-tracker";

export const usageEndpoint = {
  breakdown: getUsageBreakdown,
  track: trackUsageEvent,
};
