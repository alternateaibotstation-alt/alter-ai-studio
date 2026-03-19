import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface Props {
  prompts: string[];
  onChange: (prompts: string[]) => void;
}

export default function SuggestedPromptsEditor({ prompts, onChange }: Props) {
  const [draft, setDraft] = useState("");

  const addPrompt = () => {
    const text = draft.trim();
    if (!text || prompts.includes(text)) return;
    onChange([...prompts, text]);
    setDraft("");
  };

  const removePrompt = (index: number) => {
    onChange(prompts.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="text-sm text-muted-foreground">Suggested Prompts</label>
      <p className="text-xs text-muted-foreground/70 mt-0.5 mb-2">
        Conversation starters shown when users open this bot
      </p>
      {prompts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {prompts.map((p, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-border bg-secondary text-foreground"
            >
              {p}
              <button type="button" onClick={() => removePrompt(i)} className="hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addPrompt();
            }
          }}
          placeholder="e.g. Tell me about..."
          className="bg-secondary border-border text-sm"
        />
        <Button type="button" variant="outline" size="sm" onClick={addPrompt} disabled={!draft.trim()}>
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
