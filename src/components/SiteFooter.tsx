import { Link } from "react-router-dom";
import { Sparkles, Mail } from "lucide-react";

const legalLinks = [
  { to: "/legal/terms", label: "Terms of Service" },
  { to: "/legal/privacy", label: "Privacy Policy" },
  { to: "/legal/cookies", label: "Cookie Policy" },
  { to: "/legal/acceptable-use", label: "Acceptable Use" },
  { to: "/legal/content-policy", label: "Content Policy" },
  { to: "/legal/community", label: "Community Guidelines" },
  { to: "/legal/dmca", label: "DMCA Policy" },
  { to: "/legal/disclaimer", label: "Disclaimer" },
  { to: "/legal/payment-policy", label: "Payment & Refunds" },
  { to: "/legal/api-usage", label: "API Usage" },
];

const productLinks = [
  { to: "/create-campaign", label: "Create Campaign" },
  { to: "/campaigns", label: "My Campaigns" },
  { to: "/content-studio", label: "Content Studio" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/pricing", label: "Pricing" },
  { to: "/faq", label: "FAQ" },
];

export const SiteFooter = () => {
  return (
    <footer className="border-t border-border/50 bg-secondary/20 mt-12">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-lg font-bold tracking-tight text-foreground">AlterAI</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered ad campaign generation platform. Create conversion-optimized ads for every platform from a single brief.
            </p>
            <a
              href="mailto:alternateaibotstation@gmail.com"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-4"
            >
              <Mail className="w-4 h-4" />
              alternateaibotstation@gmail.com
            </a>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Product</h4>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-2">
            <h4 className="text-sm font-semibold text-foreground mb-3">Legal</h4>
            <ul className="grid grid-cols-2 gap-2">
              {legalLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} AlterAI — Owned and operated by Carley Lenon. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Contact: <a className="hover:text-foreground" href="mailto:alternateaibotstation@gmail.com">alternateaibotstation@gmail.com</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
