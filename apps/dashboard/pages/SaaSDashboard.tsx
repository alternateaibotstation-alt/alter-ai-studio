import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../../src/components/Navbar";
import { Button } from "../../../src/components/ui/button";
import { Textarea } from "../../../src/components/ui/textarea";
import { Progress } from "../../../src/components/ui/progress";
import { Badge } from "../../../src/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../src/components/ui/card";
import { Bot, CreditCard, History, Loader2, Sparkles, TrendingUp, Zap } from "lucide-react";
import SaaSMetricCard from "../../web/components/SaaSMetricCard";
import { useSubscription } from "../../../src/contexts/SubscriptionContext";
import { api, type Bot as BotRecord } from "../../../src/lib/api";
import { generateTikTokScript } from "../../../modules/content-tools";
import { getUsageBreakdown } from "../../../modules/analytics/usage-tracker";
import { getActionCreditCost, SAAS_PLANS } from "../../../modules/billing/plans";
import { getCreditBalance } from "../../../modules/billing/credit-guard";
import { toast } from "sonner";

export default function SaaSDashboard() {
  const { tier, remainingMessages, remainingImages } = useSubscription();
  const [bots, setBots] = useState<BotRecord[]>([]);
  const [creditBalance, setCreditBalance] = useState(0);
  const [usageBreakdown, setUsageBreakdown] = useState<any>(null);
  const [prompt, setPrompt] = useState("Create a TikTok hook for my product launch");
  const [output, setOutput] = useState("");
  const [generating, setGenerating] = useState(false);

  const plan = SAAS_PLANS[tier === "power" ? "studio" : tier === "pro" ? "creator" : "free"];
  const creditsRequired = getActionCreditCost("content_generation");
  const creditPercent = useMemo(() => Math.min(100, Math.round((creditBalance / Math.max(plan.dailyCredits, 1)) * 100)), [creditBalance, plan.dailyCredits]);

  useEffect(() => {
    api.getUserBots().then(setBots).catch(() => setBots([]));
    getCreditBalance().then(setCreditBalance).catch(() => setCreditBalance(0));
    getUsageBreakdown().then(setUsageBreakdown).catch(() => setUsageBreakdown(null));
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setOutput("");
    try {
      const response = await generateTikTokScript(prompt);
      setOutput(String(response.output));
      setCreditBalance((current) => Math.max(0, current - response.creditsUsed));
      toast.success(`${response.creditsUsed} credits used`);
    } catch (error: any) {
      toast.error(error.message || "Generation blocked by billing validation");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge variant="secondary" className="mb-3">Production SaaS dashboard</Badge>
            <h1 className="text-3xl font-bold text-foreground md:text-5xl">Create with credits, bots, and protected AI usage</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">Every AI action is routed through authentication, credit validation, deduction, and usage logging before output is returned.</p>
          </div>
          <Button asChild><Link to="/pricing">Upgrade credits</Link></Button>
        </div>

        <section className="mb-8 grid gap-4 md:grid-cols-4">
          <SaaSMetricCard icon={CreditCard} label="Credit balance" value={`${creditBalance}`} detail={`${plan.name} plan · ${plan.dailyCredits} daily credits`} />
          <SaaSMetricCard icon={Zap} label="Messages left" value={`${remainingMessages()}`} detail="Usage enforced before chat runs" />
          <SaaSMetricCard icon={Sparkles} label="Images left" value={`${remainingImages()}`} detail="Image requests are credit-gated" />
          <SaaSMetricCard icon={Bot} label="Active bots" value={`${bots.length}`} detail="Bot execution uses billing guards" />
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> AI generator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-32 bg-background" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">This action requires {creditsRequired} credits.</p>
                <Button onClick={handleGenerate} disabled={generating}>{generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating</> : "Generate safely"}</Button>
              </div>
              {output && <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm leading-6 text-foreground whitespace-pre-wrap">{output}</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Cost controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="mb-2 flex justify-between text-sm"><span className="text-muted-foreground">Daily credit capacity</span><span className="text-foreground">{creditPercent}%</span></div>
                <Progress value={creditPercent} />
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm font-medium text-foreground">Low-credit upgrade trigger</p>
                <p className="mt-1 text-sm text-muted-foreground">Upgrade prompts appear before usage can create cost loss.</p>
                <Button asChild variant="outline" className="mt-4 w-full"><Link to="/pricing">View pricing</Link></Button>
              </div>
              <div className="text-sm text-muted-foreground">Today estimated cost: ${Number(usageBreakdown?.totalCost ?? 0).toFixed(4)}</div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card id="bot-builder">
            <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /> Bot builder</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {bots.slice(0, 4).map((bot) => <div key={bot.id} className="flex items-center justify-between rounded-lg border border-border p-3"><div><p className="font-medium text-foreground">{bot.name}</p><p className="text-sm text-muted-foreground">{bot.category || "creator"} · {bot.messages_count ?? 0} messages</p></div><Button asChild size="sm" variant="outline"><Link to={`/chat/${bot.id}`}>Run</Link></Button></div>)}
              <Button asChild className="w-full"><Link to="/dashboard/legacy">Manage bots</Link></Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Usage history</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(usageBreakdown?.breakdown ?? { content_generation: 0, bot_execution: 0, chat_message: 0 }).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2 text-sm"><span className="capitalize text-muted-foreground">{key.replace(/_/g, " ")}</span><span className="font-medium text-foreground">${Number(value).toFixed(4)}</span></div>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
