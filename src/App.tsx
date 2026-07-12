import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
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

// Eagerly loaded (landing critical path)
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy-loaded routes (split into separate chunks)
const SaaSDashboard = lazy(() => import("@apps/dashboard/pages/SaaSDashboard"));
const BlogIndex = lazy(() => import("@apps/landing/pages/BlogIndex"));
const BlogArticle = lazy(() => import("@apps/landing/pages/BlogArticle"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Profile = lazy(() => import("./pages/Profile"));
const Purchases = lazy(() => import("./pages/Purchases"));
const Success = lazy(() => import("./pages/Success"));
const FAQ = lazy(() => import("./pages/FAQ"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <BrowserRouter>
          <SubscriptionProvider>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
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
                    <Route path="/privacy" element={<Navigate to="/legal/privacy" replace />} />
                    <Route path="/terms" element={<Navigate to="/legal/terms" replace />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
                    <Route path="/legal/:slug" element={<LegalPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </SubscriptionProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
