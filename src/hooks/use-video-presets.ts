import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VideoStyle } from "@/components/VideoStyleSettings";
import { toast } from "sonner";

export interface SavedPreset {
  id: string;
  name: string;
  style: VideoStyle;
  created_at: string;
}

export function useVideoPresets() {
  const [presets, setPresets] = useState<SavedPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
      }
    });
  }, []);

  const fetchPresets = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("video_style_presets" as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPresets(
        (data as any[]).map((d) => ({
          id: d.id,
          name: d.name,
          style: d.style as VideoStyle,
          created_at: d.created_at,
        }))
      );
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const savePreset = async (name: string, style: VideoStyle) => {
    if (!userId) {
      toast.error("Sign in to save presets");
      return;
    }
    const { error } = await supabase.from("video_style_presets" as any).insert({
      user_id: userId,
      name,
      style: style as any,
    } as any);

    if (error) {
      toast.error("Failed to save preset");
      return;
    }
    toast.success(`Preset "${name}" saved!`);
    fetchPresets();
  };

  const deletePreset = async (id: string) => {
    const { error } = await supabase
      .from("video_style_presets" as any)
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete preset");
      return;
    }
    toast.success("Preset deleted");
    setPresets((p) => p.filter((x) => x.id !== id));
  };

  return { presets, loading, savePreset, deletePreset, isLoggedIn: !!userId };
}
