import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Creation {
  id: string;
  title: string;
  type: string;
  file_url: string;
  thumbnail_url: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export function useCreations() {
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      if (user) fetchCreations();
      else setLoading(false);
    };
    init();
  }, []);

  const fetchCreations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_creations")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setCreations(data as Creation[]);
    setLoading(false);
  }, []);

  const saveCreation = useCallback(async (
    blob: Blob,
    title: string,
    type: "video" | "image",
    metadata: Record<string, any> = {}
  ): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Sign in to save creations");
      return false;
    }

    const ext = type === "video" ? "webm" : "png";
    const fileName = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("user-creations")
      .upload(fileName, blob, { contentType: blob.type });
    if (uploadErr) {
      console.error("Upload error:", uploadErr);
      toast.error("Failed to save creation");
      return false;
    }

    const { data: urlData } = supabase.storage
      .from("user-creations")
      .getPublicUrl(fileName);

    const { error: insertErr } = await supabase
      .from("user_creations")
      .insert({
        user_id: user.id,
        title,
        type,
        file_url: urlData.publicUrl,
        metadata,
      });

    if (insertErr) {
      console.error("Insert error:", insertErr);
      toast.error("Failed to save creation record");
      return false;
    }

    toast.success("Creation saved!");
    fetchCreations();
    return true;
  }, [fetchCreations]);

  const deleteCreation = useCallback(async (creation: Creation) => {
    // Extract storage path from URL
    const urlParts = creation.file_url.split("/user-creations/");
    if (urlParts[1]) {
      await supabase.storage.from("user-creations").remove([urlParts[1]]);
    }

    const { error } = await supabase
      .from("user_creations")
      .delete()
      .eq("id", creation.id);

    if (error) {
      toast.error("Failed to delete");
      return;
    }
    setCreations((prev) => prev.filter((c) => c.id !== creation.id));
    toast.success("Creation deleted");
  }, []);

  return { creations, loading, userId, saveCreation, deleteCreation, refetch: fetchCreations };
}
