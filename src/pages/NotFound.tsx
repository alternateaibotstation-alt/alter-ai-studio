import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error("404: non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Page Not Found"
        description="The page you're looking for doesn't exist."
        path={location.pathname}
        noindex
      />
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 pt-16">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-8xl font-extrabold gradient-text select-none">404</div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Page not found</h1>
            <p className="text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/">
                <Home className="w-4 h-4 mr-2" /> Go Home
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
