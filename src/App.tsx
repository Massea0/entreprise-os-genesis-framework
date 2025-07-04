import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import WorkDashboard from "./pages/WorkDashboard";
import Projects from "./pages/Projects";
import HREmployees from "./pages/hr/Employees";
import HRDepartments from "./pages/hr/Departments";
import HROrganization from "./pages/hr/Organization";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            
            {/* Protected routes with layout */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/work-dashboard" element={
              <ProtectedRoute>
                <AppLayout>
                  <WorkDashboard />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/projects" element={
              <ProtectedRoute>
                <AppLayout>
                  <Projects />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            {/* HR Module Routes */}
            <Route path="/hr/employees" element={
              <ProtectedRoute requiredRole="hr_manager">
                <AppLayout>
                  <HREmployees />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/hr/departments" element={
              <ProtectedRoute requiredRole="hr_manager">
                <AppLayout>
                  <HRDepartments />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/hr/organization" element={
              <ProtectedRoute requiredRole="hr_manager">
                <AppLayout>
                  <HROrganization />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/hr/*" element={
              <ProtectedRoute requiredRole="hr_manager">
                <AppLayout>
                  <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">Module RH</h2>
                    <p className="text-muted-foreground">Sélectionnez une section dans le menu</p>
                  </div>
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/business/*" element={
              <ProtectedRoute>
                <AppLayout>
                  <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">Module Business</h2>
                    <p className="text-muted-foreground">Module en cours de développement</p>
                  </div>
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/support/*" element={
              <ProtectedRoute>
                <AppLayout>
                  <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">Module Support</h2>
                    <p className="text-muted-foreground">Module en cours de développement</p>
                  </div>
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <AppLayout>
                  <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">Paramètres</h2>
                    <p className="text-muted-foreground">Configuration en cours de développement</p>
                  </div>
                </AppLayout>
              </ProtectedRoute>
            } />
            
            {/* Redirect to dashboard for authenticated users */}
            <Route path="/app" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
