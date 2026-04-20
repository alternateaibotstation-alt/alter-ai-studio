import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "alterai-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(STORAGE_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[100] glass-panel border border-border/60 rounded-2xl shadow-2xl p-4 md:p-5 animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      <button
        onClick={handleDecline}
        aria-label="Dismiss"
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
          <Cookie className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 pr-4">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            We use cookies
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Alterai.im uses essential and analytics cookies to power your experience.
            See our{" "}
            <Link
              to="/legal/cookies"
              className="text-primary hover:underline font-medium"
            >
              Cookie Policy
            </Link>{" "}
            for details.
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button size="sm" variant="outline" className="flex-1" onClick={handleDecline}>
          Decline
        </Button>
        <Button size="sm" className="flex-1" onClick={handleAccept}>
          Accept
        </Button>
      </div>
    </div>
  );
}
