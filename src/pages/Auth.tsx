import { useState, useRef, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Gift, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60_000; // 1 minute
const COOLDOWN_MS = 1_500; // 1.5s between submissions

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const failedAttempts = useRef(0);
  const lastSubmitTime = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const redirectState = location.state as { from?: string; checkout?: { tier?: string; priceId?: string } } | null;
  const redirectTo = redirectState?.from || "/dashboard";

  // Pre-fill referral code from URL param (e.g. /auth?ref=ABC123)
  useState(() => {
    const ref = searchParams.get("ref");
    if (ref) setReferralCode(ref);
  });

  const isLockedOut = useCallback(() => {
    if (lockedUntil && Date.now() < lockedUntil) {
      const secondsLeft = Math.ceil((lockedUntil - Date.now()) / 1000);
      toast({
        title: "Too many failed attempts",
        description: `Please wait ${secondsLeft}s before trying again.`,
        variant: "destructive",
      });
      return true;
    }
    if (lockedUntil && Date.now() >= lockedUntil) {
      setLockedUntil(null);
      failedAttempts.current = 0;
    }
    return false;
  }, [lockedUntil, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Cooldown between submissions
    const now = Date.now();
    if (now - lastSubmitTime.current < COOLDOWN_MS) {
      return;
    }
    lastSubmitTime.current = now;

    if (isLockedOut()) return;
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back!" });
        navigate(redirectTo, { replace: true, state: redirectState?.checkout ? { checkout: redirectState.checkout } : null });
      } else {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;

        // Redeem referral code if provided
        const trimmedCode = referralCode.trim().toUpperCase();
        if (trimmedCode && signUpData.user) {
          try {
            const { data: refData } = await supabase.functions.invoke("referral", {
              body: {
                action: "redeem",
                referralCode: trimmedCode,
              },
            });
            if (refData?.success) {
              toast({
                title: "Referral applied! 🎉",
                description: `You got ${refData.bonus} bonus messages!`,
              });
            }
          } catch {
            // Don't block signup if referral fails
          }
        }

        toast({
          title: "Check your email",
          description: "We sent you a confirmation link to verify your account.",
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });

      // Track failed login attempts
      if (isLogin) {
        failedAttempts.current += 1;
        if (failedAttempts.current >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_DURATION_MS);
          toast({
            title: "Account temporarily locked",
            description: "Too many failed attempts. Please wait 1 minute.",
            variant: "destructive",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-foreground">Alterai.im</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Sign in to your account" : "Start creating and monetizing AI bots"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="referral" className="flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-primary" />
                Referral Code
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="referral"
                type="text"
                placeholder="Enter a friend's code"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                maxLength={20}
                className="font-mono uppercase tracking-wider"
              />
              <p className="text-xs text-muted-foreground">
                Have a friend's code? You'll both get 20 bonus messages!
              </p>
            </div>
          )}

          {lockedUntil && Date.now() < lockedUntil && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md p-3">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Too many failed attempts. Please wait before trying again.</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || (!!lockedUntil && Date.now() < lockedUntil)}
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline font-medium"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
