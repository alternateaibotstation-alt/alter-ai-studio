import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, Loader2, User, LogOut, Copy, Zap, Crown, Star, Gift } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { TIER_LIMITS } from "@/lib/tiers";

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [totalReferred, setTotalReferred] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { tier, usage, subscribed, subscriptionEnd } = useSubscription();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setProfile(data as Profile);
        setUsername(data.username || "");
      }
      // Load referral stats
      try {
        const { data: refData } = await supabase.functions.invoke("referral", { body: { action: "stats" } });
        if (refData?.code) setReferralCode(refData.code);
        if (refData?.totalReferred) setTotalReferred(refData.totalReferred);
      } catch (e) { console.error("Referral load error:", e); }
      setLoading(false);
    })();
  }, [navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Max 2MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}.${ext}`;
      const { error } = await supabase.storage
        .from("user-avatars")
        .upload(path, file, { upsert: true });
      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("user-avatars")
        .getPublicUrl(path);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", profile.id);

      setProfile({ ...profile, avatar_url: avatarUrl });
      toast.success("Avatar updated");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({ 
          username: username.trim() || null,
        })
        .eq("id", profile.id);
      toast.success("Profile saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-24 pb-16 px-4 max-w-md">
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account</p>

        <div className="mt-8 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative w-24 h-24 rounded-full bg-secondary border-2 border-border flex items-center justify-center overflow-hidden group hover:border-primary/40 transition-colors"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-foreground" />
                ) : (
                  <Camera className="w-5 h-5 text-foreground" />
                )}
              </div>
            </button>
            <p className="text-xs text-muted-foreground">Click to change avatar</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-secondary border-border mt-1"
              placeholder="Your username"
              maxLength={50}
            />
          </div>

          {/* API Key Section */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Bring Your Own Key</span>
            </div>
            <p className="text-xs text-muted-foreground">Add your OpenAI API key to skip platform limits and usage fees.</p>
            <Input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="bg-secondary border-border font-mono text-sm"
              placeholder="sk-..."
            />
          </div>

          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground flex items-center gap-2">
                {tier === "power" ? <Crown className="w-4 h-4 text-primary" /> : tier === "pro" ? <Zap className="w-4 h-4 text-accent" /> : <Star className="w-4 h-4 text-muted-foreground" />}
                {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
              </span>
              {tier === "free" && (
                <Button size="sm" variant="default" asChild>
                  <Link to="/pricing">Upgrade</Link>
                </Button>
              )}
            </div>
            {tier !== "power" && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Messages: {usage.messages_used_today} / {TIER_LIMITS[tier].messages === Infinity ? "∞" : TIER_LIMITS[tier].messages + usage.bonus_messages} today</p>
                <p>Images: {usage.images_used_today} / {TIER_LIMITS[tier].images === Infinity ? "∞" : TIER_LIMITS[tier].images} today</p>
                {usage.bonus_messages > 0 && <p className="text-primary">+{usage.bonus_messages} bonus messages from referrals</p>}
              </div>
            )}
            {subscribed && subscriptionEnd && (
              <p className="text-xs text-muted-foreground">
                Renews: {new Date(subscriptionEnd).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Invite Friends</span>
            </div>
            <p className="text-xs text-muted-foreground">Share your code. Both you and your friend get 20 bonus messages!</p>
            {referralCode ? (
              <div className="flex items-center gap-2">
                <Input value={referralCode} readOnly className="bg-secondary border-border font-mono text-sm" />
                <Button size="sm" variant="outline" onClick={() => {
                  navigator.clipboard.writeText(referralCode);
                  toast.success("Copied!");
                }}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={async () => {
                const { data } = await supabase.functions.invoke("referral", { body: { action: "generate" } });
                if (data?.code) setReferralCode(data.code);
              }}>
                Generate Referral Code
              </Button>
            )}
            {totalReferred > 0 && (
              <p className="text-xs text-muted-foreground">{totalReferred} friend(s) referred</p>
            )}
          </div>

          <Button variant="outline" onClick={handleSignOut} className="w-full text-destructive hover:text-destructive">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
