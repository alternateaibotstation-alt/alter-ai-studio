import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";

interface Props {
  messages: { id: string; role: string; content: string }[];
  onHighlight: (messageId: string | null, matchIndex: number) => void;
}

export default function ChatSearchBar({ messages, onHighlight }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [currentMatch, setCurrentMatch] = useState(0);

  const matches = query.trim()
    ? messages.filter((m) =>
        m.content.toLowerCase().includes(query.trim().toLowerCase())
      )
    : [];

  const navigate = (direction: "up" | "down") => {
    if (matches.length === 0) return;
    const next =
      direction === "down"
        ? (currentMatch + 1) % matches.length
        : (currentMatch - 1 + matches.length) % matches.length;
    setCurrentMatch(next);
    onHighlight(matches[next].id, next);
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setCurrentMatch(0);
    const filtered = val.trim()
      ? messages.filter((m) =>
          m.content.toLowerCase().includes(val.trim().toLowerCase())
        )
      : [];
    if (filtered.length > 0) {
      onHighlight(filtered[0].id, 0);
    } else {
      onHighlight(null, 0);
    }
  };

  const close = () => {
    setOpen(false);
    setQuery("");
    setCurrentMatch(0);
    onHighlight(null, 0);
  };

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        title="Search messages"
      >
        <Search className="w-4 h-4 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative flex items-center">
        <Search className="absolute left-2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              navigate(e.shiftKey ? "up" : "down");
            }
            if (e.key === "Escape") close();
          }}
          placeholder="Search..."
          className="h-8 w-40 pl-7 pr-2 text-xs border-border bg-secondary"
        />
      </div>
      {query.trim() && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {matches.length > 0 ? `${currentMatch + 1}/${matches.length}` : "0"}
        </span>
      )}
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate("up")} disabled={matches.length === 0}>
        <ChevronUp className="w-3.5 h-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate("down")} disabled={matches.length === 0}>
        <ChevronDown className="w-3.5 h-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={close}>
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
