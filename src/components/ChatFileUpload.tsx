import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadedFile {
  name: string;
  url: string;
  type: string;
}

interface Props {
  onFilesReady: (files: UploadedFile[]) => void;
  files: UploadedFile[];
  onClear: () => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "text/plain", "text/csv", "text/markdown",
  "application/json",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export default function ChatFileUpload({ onFilesReady, files, onClear, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (fileList: FileList) => {
    const selected = Array.from(fileList).slice(0, 5);
    const invalid = selected.filter((f) => !ALLOWED_TYPES.includes(f.type));
    if (invalid.length) {
      toast.error(`Unsupported file type: ${invalid[0].name}`);
      return;
    }
    const tooLarge = selected.filter((f) => f.size > MAX_FILE_SIZE);
    if (tooLarge.length) {
      toast.error(`File too large (max 10MB): ${tooLarge[0].name}`);
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to upload files");
        return;
      }

      const uploaded: UploadedFile[] = [];
      for (const file of selected) {
        const ext = file.name.split(".").pop() || "bin";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage
          .from("chat-attachments")
          .upload(path, file, { contentType: file.type });
        if (error) throw error;
        const { data: urlData } = supabase.storage
          .from("chat-attachments")
          .getPublicUrl(path);
        uploaded.push({ name: file.name, url: urlData.publicUrl, type: file.type });
      }
      onFilesReady([...files, ...uploaded]);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const isImage = (type: string) => type.startsWith("image/");

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        accept={ALLOWED_TYPES.join(",")}
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        title="Attach file"
        className="text-muted-foreground"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
      </Button>
      {files.length > 0 && (
        <div className="flex items-center gap-1.5">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-secondary border border-border"
              title={f.name}
            >
              {isImage(f.type) ? (
                <img src={f.url} alt={f.name} className="w-5 h-5 rounded object-cover" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span className="max-w-[80px] truncate">{f.name}</span>
            </div>
          ))}
          <button type="button" onClick={onClear} className="text-muted-foreground hover:text-destructive">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export type { UploadedFile };
