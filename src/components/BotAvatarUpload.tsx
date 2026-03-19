import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Loader2, Bot as BotIcon } from "lucide-react";

interface BotAvatarUploadProps {
  avatarUrl: string | null;
  onUploaded: (url: string) => void;
}

export default function BotAvatarUpload({ avatarUrl, onUploaded }: BotAvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) return; // 2MB limit

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("bot-avatars")
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("bot-avatars")
        .getPublicUrl(path);

      onUploaded(urlData.publicUrl);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative w-14 h-14 rounded-xl bg-secondary border border-border flex items-center justify-center overflow-hidden group hover:border-primary/40 transition-colors shrink-0"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Bot avatar" className="w-full h-full object-cover" />
        ) : (
          <BotIcon className="w-6 h-6 text-muted-foreground" />
        )}
        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-foreground" />
          ) : (
            <Camera className="w-4 h-4 text-foreground" />
          )}
        </div>
      </button>
      <div className="text-xs text-muted-foreground">
        <p>Click to upload avatar</p>
        <p className="text-[10px]">Max 2MB · JPG, PNG, WebP</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
        disabled={uploading}
      />
    </div>
  );
}
