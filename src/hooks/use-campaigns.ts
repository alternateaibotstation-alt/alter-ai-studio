import { useState, useCallback } from "react";
import type { CampaignResult } from "@modules/ad-engine";

const STORAGE_KEY = "alterai_campaigns";

function loadCampaigns(): CampaignResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CampaignResult[]) : [];
  } catch {
    return [];
  }
}

function persistCampaigns(campaigns: CampaignResult[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<CampaignResult[]>(loadCampaigns);

  const saveCampaign = useCallback((campaign: CampaignResult) => {
    setCampaigns((prev) => {
      const exists = prev.findIndex((c) => c.id === campaign.id);
      const next = exists >= 0
        ? prev.map((c) => (c.id === campaign.id ? campaign : c))
        : [campaign, ...prev];
      persistCampaigns(next);
      return next;
    });
  }, []);

  const deleteCampaign = useCallback((id: string) => {
    setCampaigns((prev) => {
      const next = prev.filter((c) => c.id !== id);
      persistCampaigns(next);
      return next;
    });
  }, []);

  const getCampaign = useCallback(
    (id: string) => campaigns.find((c) => c.id === id) ?? null,
    [campaigns]
  );

  return { campaigns, saveCampaign, deleteCampaign, getCampaign };
}
