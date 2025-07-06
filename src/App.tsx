
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { AIContextProvider } from "@/components/ai/AIContextProvider";

// Pages
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import WorkDashboard from "./pages/WorkDashboard";
import Projects from "./pages/Projects";
import ProjectsList from "./pages/ProjectsList";
import ProjectDetail from "./pages/ProjectDetail";
import TaskDetailGitLab from "./pages/TaskDetailGitLab";
import Employees from "./pages/hr/Employees";
import EmployeeDetail from "./pages/hr/EmployeeDetail";
import Departments from "./pages/hr/Departments";
import Organization from "./pages/hr/Organization";
import Quotes from "./pages/business/Quotes";
import QuoteForm from "./pages/business/QuoteForm";
import Invoices from "./pages/business/Invoices";
import Clients from "./pages/business/Clients";
import SynapsePage from "./pages/SynapsePage";
import SupportAdmin from "./pages/admin/SupportAdmin";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AIContextProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes with layout */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Index />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
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

                <Route path="/synapse" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <SynapsePage />
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

                <Route path="/projects/list" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ProjectsList />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/projects/:id" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ProjectDetail />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/tasks/:id" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <TaskDetailGitLab />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                {/* HR Routes */}
                <Route path="/hr/employees" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Employees />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/hr/employees/:id" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <EmployeeDetail />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/hr/departments" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Departments />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/hr/organization" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Organization />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                {/* Business Routes */}
                <Route path="/business/quotes" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Quotes />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/business/quotes/new" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <QuoteForm />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/business/invoices" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Invoices />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/business/clients" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Clients />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                {/* Support/Admin Routes */}
                <Route path="/admin/support" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <SupportAdmin />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/support/tickets" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <SupportAdmin />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                <Route path="/support/knowledge" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <div className="p-6">
                        <h1 className="text-2xl font-bold mb-4">Base de connaissances</h1>
                        <p className="text-muted-foreground">Cette section sera bientôt disponible.</p>
                      </div>
                    </AppLayout>
                  </ProtectedRoute>
                } />

                {/* Redirect unmatched routes to dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AIContextProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
