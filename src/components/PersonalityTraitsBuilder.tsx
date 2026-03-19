import { useCallback, useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";

export interface PersonalityTraits {
  humor: number;
  formality: number;
  empathy: number;
  creativity: number;
  verbosity: number;
  enthusiasm: number;
}

const DEFAULT_TRAITS: PersonalityTraits = {
  humor: 50,
  formality: 50,
  empathy: 50,
  creativity: 50,
  verbosity: 50,
  enthusiasm: 50,
};

const TRAIT_CONFIG: {
  key: keyof PersonalityTraits;
  label: string;
  lowLabel: string;
  highLabel: string;
  emoji: string;
}[] = [
  { key: "humor", label: "Humor", lowLabel: "Serious", highLabel: "Witty", emoji: "😄" },
  { key: "formality", label: "Formality", lowLabel: "Casual", highLabel: "Professional", emoji: "🎩" },
  { key: "empathy", label: "Empathy", lowLabel: "Direct", highLabel: "Compassionate", emoji: "💛" },
  { key: "creativity", label: "Creativity", lowLabel: "Practical", highLabel: "Imaginative", emoji: "🎨" },
  { key: "verbosity", label: "Detail Level", lowLabel: "Concise", highLabel: "Thorough", emoji: "📝" },
  { key: "enthusiasm", label: "Energy", lowLabel: "Calm", highLabel: "Enthusiastic", emoji: "⚡" },
];

function generatePersonaFromTraits(traits: PersonalityTraits): string {
  const parts: string[] = ["You are a helpful AI assistant."];

  // Humor
  if (traits.humor >= 75) parts.push("You have a great sense of humor and enjoy adding wit, jokes, and lighthearted comments to conversations.");
  else if (traits.humor >= 50) parts.push("You occasionally use light humor to keep things engaging.");
  else if (traits.humor < 25) parts.push("You maintain a serious, no-nonsense tone at all times.");

  // Formality
  if (traits.formality >= 75) parts.push("You communicate in a polished, professional manner with proper grammar and formal language.");
  else if (traits.formality >= 50) parts.push("You strike a balance between professional and approachable language.");
  else if (traits.formality < 25) parts.push("You speak in a very casual, friendly, conversational way — like texting a friend.");

  // Empathy
  if (traits.empathy >= 75) parts.push("You are deeply empathetic — you always acknowledge feelings, validate emotions, and show genuine care.");
  else if (traits.empathy >= 50) parts.push("You show warmth and understanding when appropriate.");
  else if (traits.empathy < 25) parts.push("You are straightforward and focus on facts over feelings.");

  // Creativity
  if (traits.creativity >= 75) parts.push("You think outside the box, offer creative suggestions, and use vivid metaphors and analogies.");
  else if (traits.creativity >= 50) parts.push("You blend practical advice with occasional creative ideas.");
  else if (traits.creativity < 25) parts.push("You stick to proven, practical, and conventional advice.");

  // Verbosity
  if (traits.verbosity >= 75) parts.push("You provide thorough, detailed explanations with examples and context.");
  else if (traits.verbosity >= 50) parts.push("You give moderately detailed responses — enough to be helpful without overwhelming.");
  else if (traits.verbosity < 25) parts.push("You keep responses very short and to the point — brevity is key.");

  // Enthusiasm
  if (traits.enthusiasm >= 75) parts.push("You are highly enthusiastic and energetic — you use exclamation marks, encouraging words, and radiate positivity!");
  else if (traits.enthusiasm >= 50) parts.push("You maintain a positive and engaged tone.");
  else if (traits.enthusiasm < 25) parts.push("You are calm, measured, and understated in your delivery.");

  return parts.join(" ");
}

// Try to parse traits from an existing persona string (returns defaults if not parseable)
function parseTraitsFromPersona(persona: string): PersonalityTraits | null {
  if (!persona || !persona.includes("You are a helpful AI assistant.")) return null;

  const traits = { ...DEFAULT_TRAITS };

  if (persona.includes("great sense of humor")) traits.humor = 85;
  else if (persona.includes("light humor")) traits.humor = 60;
  else if (persona.includes("no-nonsense")) traits.humor = 15;

  if (persona.includes("polished, professional")) traits.formality = 85;
  else if (persona.includes("balance between professional")) traits.formality = 60;
  else if (persona.includes("texting a friend")) traits.formality = 15;

  if (persona.includes("deeply empathetic")) traits.empathy = 85;
  else if (persona.includes("warmth and understanding")) traits.empathy = 60;
  else if (persona.includes("facts over feelings")) traits.empathy = 15;

  if (persona.includes("outside the box")) traits.creativity = 85;
  else if (persona.includes("occasional creative")) traits.creativity = 60;
  else if (persona.includes("conventional advice")) traits.creativity = 15;

  if (persona.includes("thorough, detailed")) traits.verbosity = 85;
  else if (persona.includes("moderately detailed")) traits.verbosity = 60;
  else if (persona.includes("brevity is key")) traits.verbosity = 15;

  if (persona.includes("highly enthusiastic")) traits.enthusiasm = 85;
  else if (persona.includes("positive and engaged")) traits.enthusiasm = 60;
  else if (persona.includes("calm, measured")) traits.enthusiasm = 15;

  return traits;
}

interface PersonalityTraitsBuilderProps {
  persona: string;
  onPersonaChange: (persona: string) => void;
}

export default function PersonalityTraitsBuilder({
  persona,
  onPersonaChange,
}: PersonalityTraitsBuilderProps) {
  const [useBuilder, setUseBuilder] = useState(() => {
    return !persona || parseTraitsFromPersona(persona) !== null;
  });

  const [traits, setTraits] = useState<PersonalityTraits>(() => {
    return parseTraitsFromPersona(persona) || { ...DEFAULT_TRAITS };
  });

  const updateTrait = useCallback(
    (key: keyof PersonalityTraits, value: number) => {
      setTraits((prev) => {
        const next = { ...prev, [key]: value };
        if (useBuilder) {
          onPersonaChange(generatePersonaFromTraits(next));
        }
        return next;
      });
    },
    [useBuilder, onPersonaChange]
  );

  // Sync generated persona when switching to builder mode
  useEffect(() => {
    if (useBuilder) {
      onPersonaChange(generatePersonaFromTraits(traits));
    }
  // Only run when toggling useBuilder on
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useBuilder]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm text-muted-foreground">Personality</label>
        <button
          type="button"
          onClick={() => setUseBuilder(!useBuilder)}
          className="text-xs text-primary hover:underline"
        >
          {useBuilder ? "Write custom prompt" : "Use trait sliders"}
        </button>
      </div>

      {useBuilder ? (
        <div className="space-y-4 rounded-lg border border-border bg-secondary/50 p-4">
          {TRAIT_CONFIG.map((trait) => (
            <div key={trait.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {trait.emoji} {trait.label}
                </span>
                <span className="text-foreground font-medium tabular-nums w-8 text-right">
                  {traits[trait.key]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-16 text-right shrink-0">
                  {trait.lowLabel}
                </span>
                <Slider
                  value={[traits[trait.key]]}
                  onValueChange={([v]) => updateTrait(trait.key, v)}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <span className="text-[10px] text-muted-foreground w-20 shrink-0">
                  {trait.highLabel}
                </span>
              </div>
            </div>
          ))}

          <div className="pt-2 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
              <span className="font-medium text-foreground/70">Preview: </span>
              {generatePersonaFromTraits(traits)}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
