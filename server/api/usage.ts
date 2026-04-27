import { getUsageBreakdown, trackUsageEvent } from "@modules/analytics";

export const usageEndpoint = {
  breakdown: getUsageBreakdown,
  track: trackUsageEvent,
};
