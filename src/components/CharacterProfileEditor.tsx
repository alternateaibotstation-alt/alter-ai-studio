import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, X, Palette } from "lucide-react";

export interface CharacterProfile {
  name: string;
  appearance: string;
  personality: string;
}

export interface StoryProfile {
  characters: CharacterProfile[];
  visualStyle: string;
  mood: string;
  setting: string;
}

export const emptyStoryProfile: StoryProfile = {
  characters: [],
  visualStyle: "",
  mood: "",
  setting: "",
};

interface Props {
  profile: StoryProfile;
  onChange: (profile: StoryProfile) => void;
}

export default function CharacterProfileEditor({ profile, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);

  const addCharacter = () => {
    onChange({
      ...profile,
      characters: [...profile.characters, { name: "", appearance: "", personality: "" }],
    });
    setExpanded(true);
  };

  const updateCharacter = (idx: number, field: keyof CharacterProfile, value: string) => {
    const updated = [...profile.characters];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange({ ...profile, characters: updated });
  };

  const removeCharacter = (idx: number) => {
    onChange({ ...profile, characters: profile.characters.filter((_, i) => i !== idx) });
  };

  const hasProfile = profile.characters.length > 0 || profile.visualStyle || profile.mood || profile.setting;

  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="w-4 h-4 text-accent" />
          Character & Style Profile
          {hasProfile && <Badge variant="secondary" className="text-xs">Active</Badge>}
          <span className="ml-auto text-xs text-muted-foreground">{expanded ? "▲" : "▼"}</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Define characters and visual style for consistent short movies
        </p>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Characters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Characters</label>
              <Button variant="ghost" size="sm" onClick={addCharacter}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Character
              </Button>
            </div>
            {profile.characters.map((char, idx) => (
              <div key={idx} className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Character name"
                    value={char.name}
                    onChange={(e) => updateCharacter(idx, "name", e.target.value)}
                    className="bg-background border-border text-sm h-8"
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeCharacter(idx)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <Textarea
                  placeholder="Appearance: hair color, clothing, features, age..."
                  value={char.appearance}
                  onChange={(e) => updateCharacter(idx, "appearance", e.target.value)}
                  className="bg-background border-border text-sm min-h-[60px]"
                />
                <Input
                  placeholder="Personality: confident, mysterious, playful..."
                  value={char.personality}
                  onChange={(e) => updateCharacter(idx, "personality", e.target.value)}
                  className="bg-background border-border text-sm h-8"
                />
              </div>
            ))}
            {profile.characters.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No characters yet. Add one to maintain consistency across scenes.</p>
            )}
          </div>

          {/* Visual Style */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" /> Visual Style
            </label>
            <Input
              placeholder="e.g. Cinematic noir, neon-lit cyberpunk, warm golden hour..."
              value={profile.visualStyle}
              onChange={(e) => onChange({ ...profile, visualStyle: e.target.value })}
              className="bg-background border-border text-sm"
            />
          </div>

          {/* Mood */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mood / Tone</label>
            <Input
              placeholder="e.g. Mysterious, empowering, nostalgic, chaotic energy..."
              value={profile.mood}
              onChange={(e) => onChange({ ...profile, mood: e.target.value })}
              className="bg-background border-border text-sm"
            />
          </div>

          {/* Setting */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Setting / Environment</label>
            <Input
              placeholder="e.g. Futuristic city rooftop, cozy bedroom, desert highway..."
              value={profile.setting}
              onChange={(e) => onChange({ ...profile, setting: e.target.value })}
              className="bg-background border-border text-sm"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
