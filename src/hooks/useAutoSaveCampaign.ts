import { useEffect, useRef, useCallback } from 'react';
import { CampaignIntegrationService, CampaignSaveData } from '@/lib/portfolio/campaign-integration';
import { toast } from 'sonner';

interface UseAutoSaveCampaignOptions {
  portfolioId: string | null;
  campaignId?: string;
  enabled?: boolean;
  debounceMs?: number;
  onSave?: (campaignId: string) => void;
  onError?: (error: Error) => void;
}

export function useAutoSaveCampaign(
  campaignData: Partial<CampaignSaveData>,
  options: UseAutoSaveCampaignOptions
) {
  const {
    portfolioId,
    campaignId,
    enabled = true,
    debounceMs = 3000,
    onSave,
    onError,
  } = options;

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSavedData = useRef<Partial<CampaignSaveData> | null>(null);
  const currentCampaignId = useRef<string | null>(campaignId || null);
  const isSaving = useRef(false);

  const saveData = useCallback(async () => {
    if (!enabled || !portfolioId || isSaving.current) return;

    try {
      isSaving.current = true;

      // Check if data has actually changed
      if (JSON.stringify(lastSavedData.current) === JSON.stringify(campaignData)) {
        isSaving.current = false;
        return;
      }

      if (currentCampaignId.current) {
        // Update existing draft
        const success = await CampaignIntegrationService.updateDraftCampaign(
          currentCampaignId.current,
          campaignData
        );

        if (success) {
          lastSavedData.current = campaignData;
          onSave?.(currentCampaignId.current);
        } else {
          throw new Error('Failed to save campaign');
        }
      } else {
        // Create new draft
        const newCampaignId = await CampaignIntegrationService.saveDraftCampaign(
          portfolioId,
          campaignData
        );

        if (newCampaignId) {
          currentCampaignId.current = newCampaignId;
          lastSavedData.current = campaignData;
          onSave?.(newCampaignId);
        } else {
          throw new Error('Failed to create campaign');
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Auto-save error:', err);
      onError?.(err);
    } finally {
      isSaving.current = false;
    }
  }, [campaignData, enabled, portfolioId, onSave, onError]);

  // Debounced auto-save
  useEffect(() => {
    if (!enabled) return;

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      saveData();
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [campaignData, enabled, debounceMs, saveData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    campaignId: currentCampaignId.current,
    isSaving: isSaving.current,
    saveNow: saveData,
  };
}
