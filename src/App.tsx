import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import AppLayout from "@/components/AppLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import RequireAuth from "@/components/RequireAuth";
import { verifyDeploymentBase } from "@/lib/base-check";

verifyDeploymentBase();

import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Success from "./pages/Success";
import Purchases from "./pages/Purchases";
import Profile from "./pages/Profile";
import Pricing from "./pages/Pricing";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import LegalPage from "./pages/LegalPage";
import FAQ from "./pages/FAQ";
import NotFound from "./pages/NotFound";
import SaaSDashboard from "@apps/dashboard/pages/SaaSDashboard";
import BlogIndex from "@apps/landing/pages/BlogIndex";
import BlogArticle from "@apps/landing/pages/BlogArticle";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <BrowserRouter>
          <SubscriptionProvider>
            <ErrorBoundary>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route
                    path="/dashboard"
                    element={
                      <RequireAuth>
                        <SaaSDashboard />
                      </RequireAuth>
                    }
                  />
                  <Route path="/blog" element={<BlogIndex />} />
                  <Route path="/blog/:slug" element={<BlogArticle />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/purchases" element={<Purchases />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/success" element={<Success />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/legal/:slug" element={<LegalPage />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </ErrorBoundary>
          </SubscriptionProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
