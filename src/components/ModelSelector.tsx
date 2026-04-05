import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MODELS = [
  { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", desc: "Fast & balanced" },
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", desc: "Good multimodal" },
  { value: "openai/gpt-4.1-mini", label: "GPT-4.1 Mini", desc: "Strong & affordable" },
  { value: "openai/gpt-4.1", label: "GPT-4.1", desc: "Most powerful" },
  { value: "openai/gpt-4.1-nano", label: "GPT-4.1 Nano", desc: "Fast & cheap" },
];

interface Props {
  value: string;
  onChange: (model: string) => void;
}

export default function ModelSelector({ value, onChange }: Props) {
  return (
    <div>
      <label className="text-sm text-muted-foreground">AI Model</label>
      <p className="text-xs text-muted-foreground/70 mt-0.5 mb-1.5">
        Default model for chat. Image generation auto-switches.
      </p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-secondary border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MODELS.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              <span className="font-medium">{m.label}</span>
              <span className="text-muted-foreground ml-2 text-xs">— {m.desc}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
