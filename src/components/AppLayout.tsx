import { Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import CookieConsent from "@/components/CookieConsent";

/**
 * Global app layout.
 *
 * Renders inside <BrowserRouter>, so every descendant — including <Outlet/>
 * page content and any component using react-router hooks like useLocation,
 * useNavigate, or <Link> — is guaranteed to have router context.
 *
 * Global UI chrome (toasters, cookie banner) lives here so it appears on
 * every route without each page having to opt in.
 */
export default function AppLayout() {
  return (
    <>
      <Toaster />
      <Sonner />
      <CookieConsent />
      <Outlet />
    </>
  );
}
