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

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign in with Google";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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

        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            className="w-full py-6 text-base font-medium border-border/50 bg-card/30 hover:bg-accent/50 transition-all flex items-center justify-center gap-3"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
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
        </div>

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
