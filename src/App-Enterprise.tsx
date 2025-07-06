/**
 * === ENTERPRISE OS GENESIS FRAMEWORK ===
 * Application principale avec architecture modulaire enterprise
 * Qualité exceptionnelle avec TypeScript strict
 */

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from 'next-themes';

// Enterprise Components
import { EnterpriseLayout } from './components/enterprise/layout/EnterpriseLayout';
import { DashboardModule } from './modules/enterprise/dashboard/DashboardModule';

// Types
import type { ModuleType, UserRole } from './types/enterprise';

// Query Client Configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// === COMPONENT PRINCIPAL === //

const App: React.FC = () => {
  // État de l'application
  const [currentModule, setCurrentModule] = useState<ModuleType>('dashboard');
  
  // Simulation d'un utilisateur connecté (à remplacer par l'authentification réelle)
  const currentUser = {
    id: '1',
    email: 'admin@entreprise.com',
    firstName: 'Admin',
    lastName: 'Système',
    role: 'admin' as UserRole,
    companyId: 'company-1',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Gestionnaire de changement de module
  const handleModuleChange = (module: ModuleType) => {
    setCurrentModule(module);
  };

  // Rendu des modules
  const renderCurrentModule = () => {
    switch (currentModule) {
      case 'dashboard':
        return <DashboardModule />;
      
      case 'hr':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-enterprise-neutral-900 dark:text-white">
              Module RH
            </h1>
            <p className="text-enterprise-neutral-600 dark:text-enterprise-neutral-400 mt-2">
              Module Ressources Humaines à venir (Sprint 2)
            </p>
          </div>
        );
      
      case 'business':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-enterprise-neutral-900 dark:text-white">
              Module Business Intelligence
            </h1>
            <p className="text-enterprise-neutral-600 dark:text-enterprise-neutral-400 mt-2">
              Module Business Intelligence à venir (Sprint 2)
            </p>
          </div>
        );
      
      case 'support':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-enterprise-neutral-900 dark:text-white">
              Module Support Client
            </h1>
            <p className="text-enterprise-neutral-600 dark:text-enterprise-neutral-400 mt-2">
              Module Support Client à venir (Sprint 2)
            </p>
          </div>
        );
      
      case 'admin':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-enterprise-neutral-900 dark:text-white">
              Module Administration
            </h1>
            <p className="text-enterprise-neutral-600 dark:text-enterprise-neutral-400 mt-2">
              Module Administration à venir (Sprint 2)
            </p>
          </div>
        );
      
      case 'analytics':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-enterprise-neutral-900 dark:text-white">
              Module Analytics
            </h1>
            <p className="text-enterprise-neutral-600 dark:text-enterprise-neutral-400 mt-2">
              Module Analytics à venir (Sprint 2)
            </p>
          </div>
        );
      
      default:
        return <DashboardModule />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <TooltipProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-enterprise-neutral-50 dark:bg-enterprise-neutral-950">
              <Routes>
                {/* Route principale Enterprise OS */}
                <Route
                  path="/*"
                  element={
                    <EnterpriseLayout
                      currentUser={currentUser}
                      currentModule={currentModule}
                      onModuleChange={handleModuleChange}
                    >
                      {renderCurrentModule()}
                    </EnterpriseLayout>
                  }
                />
                
                {/* Redirection par défaut */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
            
            {/* Notifications */}
            <Toaster />
            <Sonner />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
