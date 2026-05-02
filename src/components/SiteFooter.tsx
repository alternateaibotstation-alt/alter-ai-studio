import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="border-t border-border/30 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="Alterai.im" className="w-6 h-6" />
              <span className="font-bold gradient-text">Alterai.im</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              AI ad campaign generator. Full campaigns in under 60 seconds.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">
              Product
            </h4>
            <nav className="space-y-2">
              <Link
                to="/dashboard"
                className="block text-sm text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                to="/pricing"
                className="block text-sm text-muted-foreground hover:text-foreground"
              >
                Pricing
              </Link>
              <Link
                to="/auth"
                className="block text-sm text-muted-foreground hover:text-foreground"
              >
                Sign Up
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">
              Resources
            </h4>
            <nav className="space-y-2">
              <Link
                to="/blog"
                className="block text-sm text-muted-foreground hover:text-foreground"
              >
                Blog
              </Link>
              <Link
                to="/blog/ai-advertising-strategies-2025"
                className="block text-sm text-muted-foreground hover:text-foreground"
              >
                AI Ad Strategies
              </Link>
              <Link
                to="/blog/tiktok-ad-creation-guide"
                className="block text-sm text-muted-foreground hover:text-foreground"
              >
                TikTok Ad Guide
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">
              Legal
            </h4>
            <nav className="space-y-2">
              <Link
                to="/terms"
                className="block text-sm text-muted-foreground hover:text-foreground"
              >
                Terms of Service
              </Link>
              <Link
                to="/privacy"
                className="block text-sm text-muted-foreground hover:text-foreground"
              >
                Privacy Policy
              </Link>
            </nav>
          </div>
        </div>

        <div className="border-t border-border/30 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Alterai.im. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
