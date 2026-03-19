import { useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Download, Upload, Loader2 } from "lucide-react";
import { api, type Bot } from "@/lib/api";
import { toast } from "sonner";

// Schema for validating imported bot configs
const botConfigSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().max(1000).nullable().optional(),
  persona: z.string().max(5000).nullable().optional(),
  category: z.string().max(50).nullable().optional(),
  is_public: z.boolean().optional(),
  price: z.number().min(0).max(99999).optional(),
  suggested_prompts: z.array(z.string().max(200)).max(10).optional(),
});

const botConfigArraySchema = z.union([
  botConfigSchema,
  z.array(botConfigSchema).min(1).max(50),
]);

export type BotExportConfig = z.infer<typeof botConfigSchema>;

function exportBot(bot: Bot) {
  const config: BotExportConfig = {
    name: bot.name,
    description: bot.description,
    persona: bot.persona,
    category: bot.category,
    is_public: bot.is_public,
    price: bot.price,
    suggested_prompts: bot.suggested_prompts,
  };
  return config;
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface BotImportExportProps {
  bots: Bot[];
  onImported: () => void;
}

export default function BotImportExport({ bots, onImported }: BotImportExportProps) {
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExportAll = () => {
    if (bots.length === 0) {
      toast.error("No bots to export");
      return;
    }
    const configs = bots.map(exportBot);
    downloadJson(configs, "my-bots.json");
    toast.success(`Exported ${configs.length} bot(s)`);
  };

  const handleExportSingle = (bot: Bot) => {
    const config = exportBot(bot);
    const safeName = bot.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    downloadJson(config, `${safeName}.json`);
    toast.success(`Exported "${bot.name}"`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = "";

    if (file.size > 1024 * 1024) {
      toast.error("File too large (max 1MB)");
      return;
    }

    setImporting(true);
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        toast.error("Invalid JSON file");
        return;
      }

      const result = botConfigArraySchema.safeParse(parsed);
      if (!result.success) {
        const firstErr = result.error.errors[0]?.message || "Invalid bot config";
        toast.error(`Validation error: ${firstErr}`);
        return;
      }

      const configs = Array.isArray(result.data) ? result.data : [result.data];
      let created = 0;

      for (const config of configs) {
        try {
          await api.createBot({
            name: config.name,
            description: config.description ?? null,
            persona: config.persona ?? null,
            category: config.category ?? "general",
            is_public: config.is_public ?? true,
            price: config.price ?? 0,
          });
          created++;
        } catch (err) {
          console.error(`Failed to import "${config.name}":`, err);
        }
      }

      if (created > 0) {
        toast.success(`Imported ${created} bot(s)`);
        onImported();
      } else {
        toast.error("No bots were imported");
      }
    } catch {
      toast.error("Failed to import bots");
    } finally {
      setImporting(false);
    }
  };

  return {
    importing,
    fileRef,
    handleExportAll,
    handleExportSingle,
    handleImport,
    ImportInput: (
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImport}
        disabled={importing}
      />
    ),
  };
}
