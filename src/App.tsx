import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import Home from "./pages/Home";
import Marketplace from "./pages/Marketplace";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Success from "./pages/Success";
import Purchases from "./pages/Purchases";
import Profile from "./pages/Profile";
import ArtStudio from "./pages/ArtStudio";
import Pricing from "./pages/Pricing";
import AdminDashboard from "./pages/AdminDashboard";
import Companions from "./pages/Companions";
import CompanionProfile from "./pages/CompanionProfile";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import ContentStudio from "./pages/ContentStudio";
import MyCreations from "./pages/MyCreations";
import TemplateMarketplace from "./pages/TemplateMarketplace";
import TikTokTemplates from "./pages/TikTokTemplates";
import ContentCreator from "./pages/ContentCreator";
import LegalPage from "./pages/LegalPage";
import FAQ from "./pages/FAQ";
import NotFound from "./pages/NotFound";
import CookieConsent from "./components/CookieConsent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <BrowserRouter>
          <SubscriptionProvider>
            <Toaster />
            <Sonner />
            <CookieConsent />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/chat/:id" element={<Chat />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/success" element={<Success />} />
              <Route path="/art-studio" element={<ArtStudio />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/companions" element={<Companions />} />
              <Route path="/companion/:id" element={<CompanionProfile />} />
              <Route path="/content-studio" element={<ContentStudio />} />
              <Route path="/my-creations" element={<MyCreations />} />
              <Route path="/template-marketplace" element={<TemplateMarketplace />} />
              <Route path="/tiktok-templates" element={<TikTokTemplates />} />
              <Route path="/content-creator" element={<ContentCreator />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/legal/:slug" element={<LegalPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SubscriptionProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
