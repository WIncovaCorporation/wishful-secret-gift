import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AIShoppingAssistant } from "@/components/AIShoppingAssistant";
import { InstallPWA } from "@/components/InstallPWA";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import UpdatePassword from "./pages/UpdatePassword";
import DeleteAccount from "./pages/DeleteAccount";
import Dashboard from "./pages/Dashboard";
import Lists from "./pages/Lists";
import Groups from "./pages/Groups";
import Events from "./pages/Events";
import Assignment from "./pages/Assignment";
import GroupAssignments from "./pages/GroupAssignments";
import Messages from "./pages/Messages";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import HowItWorks from "./pages/HowItWorks";
import NotFound from "./pages/NotFound";
import RolesTest from "./pages/RolesTest";
import Pricing from "./pages/Pricing";
import Marketplace from "./pages/Marketplace";
import MyProducts from "./pages/MyProducts";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import AdminCorrections from "./pages/AdminCorrections";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <AnalyticsProvider>
              <AIShoppingAssistant />
              <InstallPWA />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/update-password" element={<UpdatePassword />} />
                <Route path="/delete-account" element={<DeleteAccount />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/lists" element={<Lists />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/groups/:groupId/assignment" element={<Assignment />} />
                <Route path="/assignment/:groupId" element={<Assignment />} />
                <Route path="/groups/:groupId/admin" element={<GroupAssignments />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/events" element={<Events />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/roles-test" element={<RolesTest />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/my-products" element={<MyProducts />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
          <Route path="/admin/corrections" element={<AdminCorrections />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnalyticsProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;