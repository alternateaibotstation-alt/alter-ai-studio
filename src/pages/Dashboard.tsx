import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, MessageSquare, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { api, type Bot } from "@/lib/api";
import PersonalityTraitsBuilder from "@/components/PersonalityTraitsBuilder";
import BotAvatarUpload from "@/components/BotAvatarUpload";

export default function Dashboard() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<Bot | null>(null);
  const [form, setForm] = useState({ name: "", description: "", persona: "", category: "wellness", is_public: true, price: 0, avatar_url: "" });
  const [saving, setSaving] = useState(false);

  const fetchBots = () => {
    api.getUserBots()
      .then((data) => setBots(Array.isArray(data) ? data : []))
      .catch(() => setBots([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBots(); }, []);

  const openCreate = () => {
    setEditingBot(null);
    setForm({ name: "", description: "", persona: "", category: "wellness", is_public: true, price: 0 });
    setDialogOpen(true);
  };

  const openEdit = (bot: Bot) => {
    setEditingBot(bot);
    setForm({
      name: bot.name,
      description: bot.description || "",
      persona: bot.persona || "",
      category: bot.category || "wellness",
      is_public: bot.is_public,
      price: bot.price || 0,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingBot) {
        await api.updateBot({ id: editingBot.id, ...form });
      } else {
        await api.createBot(form);
      }
      setDialogOpen(false);
      fetchBots();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bot?")) return;
    try {
      await api.deleteBot(id);
      fetchBots();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-24 pb-16 px-4 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your AI bots</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" /> New Bot
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingBot ? "Edit Bot" : "Create Bot"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Name</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-secondary border-border mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Description</label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="bg-secondary border-border mt-1"
                    rows={2}
                  />
                </div>
                <PersonalityTraitsBuilder
                  persona={form.persona}
                  onPersonaChange={(persona) => setForm({ ...form, persona })}
                />
                <div>
                  <label className="text-sm text-muted-foreground">Custom Prompt (advanced)</label>
                  <Textarea
                    value={form.persona}
                    onChange={(e) => setForm({ ...form, persona: e.target.value })}
                    className="bg-secondary border-border mt-1"
                    rows={3}
                    placeholder="You are a helpful assistant that..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Category</label>
                    <Input
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="bg-secondary border-border mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Price ($)</label>
                    <Input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                      className="bg-secondary border-border mt-1"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingBot ? "Save Changes" : "Create Bot"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-8 space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-card border border-border animate-pulse" />
            ))
          ) : bots.length === 0 ? (
            <button
              onClick={openCreate}
              className="w-full rounded-lg border-2 border-dashed border-border p-12 text-center text-muted-foreground hover:border-primary/30 transition-colors"
            >
              <Plus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              Create your first bot
            </button>
          ) : (
            bots.map((bot) => (
              <div
                key={bot.id}
                className="rounded-lg border border-border bg-card p-4 flex items-center justify-between card-hover"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm">{bot.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="capitalize">{bot.category}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {bot.messages_count ?? 0}
                    </span>
                    <span>·</span>
                    <span className={bot.status === "active" ? "text-accent" : ""}>
                      {bot.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(bot)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(bot.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                  <Button size="sm" variant="secondary" asChild>
                    <Link to={`/chat/${bot.id}`}>Chat</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
