import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FleetProvider, useFleet } from "@/contexts/FleetContext";
import { Layout } from "@/components/Layout";
import { Loader2 } from "lucide-react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VehicleRegistry from "./pages/VehicleRegistry";
import TripDispatcher from "./pages/TripDispatcher";
import Maintenance from "./pages/Maintenance";
import ExpenseFuel from "./pages/ExpenseFuel";
import DriverPerformance from "./pages/DriverPerformance";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import type { UserRole } from "@/types/fleet";

const queryClient = new QueryClient();

const ROLE_ACCESS: Record<string, UserRole[]> = {
  '/': ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'],
  '/vehicles': ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'],
  '/trips': ['Fleet Manager', 'Dispatcher', 'Safety Officer'],
  '/maintenance': ['Fleet Manager', 'Safety Officer'],
  '/expenses': ['Fleet Manager', 'Financial Analyst'],
  '/drivers': ['Fleet Manager', 'Safety Officer'],
  '/analytics': ['Fleet Manager', 'Financial Analyst'],
};

const RBACRoute = ({ path, children }: { path: string; children: React.ReactNode }) => {
  const { user } = useFleet();
  const allowed = ROLE_ACCESS[path] ?? [];
  if (user && !allowed.includes(user.role)) {
    return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground text-lg">Access denied. Your role ({user.role}) cannot view this page.</p></div>;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, authLoading } = useFleet();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Login />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<RBACRoute path="/"><Dashboard /></RBACRoute>} />
        <Route path="/vehicles" element={<RBACRoute path="/vehicles"><VehicleRegistry /></RBACRoute>} />
        <Route path="/trips" element={<RBACRoute path="/trips"><TripDispatcher /></RBACRoute>} />
        <Route path="/maintenance" element={<RBACRoute path="/maintenance"><Maintenance /></RBACRoute>} />
        <Route path="/expenses" element={<RBACRoute path="/expenses"><ExpenseFuel /></RBACRoute>} />
        <Route path="/drivers" element={<RBACRoute path="/drivers"><DriverPerformance /></RBACRoute>} />
        <Route path="/analytics" element={<RBACRoute path="/analytics"><Analytics /></RBACRoute>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <FleetProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </FleetProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
