
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AIContextData {
  projects: any[];
  employees: any[];
  companies: any[];
  tasks: any[];
  devis: any[];
  invoices: any[];
  insights: any[];
  currentModule: string;
  contextualSuggestions: ContextualSuggestion[];
  isLoading: boolean;
  refreshContext: () => Promise<void>;
  addInsight: (insight: any) => void;
}

interface ContextualSuggestion {
  text: string;
  action: string;
  icon: string;
  module: string;
}

interface AIContextProviderProps {
  children: ReactNode;
}

const AIContext = createContext<AIContextData | undefined>(undefined);

export const AIContextProvider: React.FC<AIContextProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  const [contextData, setContextData] = useState({
    projects: [],
    employees: [],
    companies: [],
    tasks: [],
    devis: [],
    invoices: [],
    insights: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [contextualSuggestions, setContextualSuggestions] = useState<ContextualSuggestion[]>([]);

  // Déterminer le module actuel
  const getCurrentModule = (): string => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/projects')) return 'projects';
    if (path.includes('/hr')) return 'hr';
    if (path.includes('/business')) return 'business';
    if (path.includes('/synapse')) return 'synapse';
    return 'general';
  };

  // Générer des suggestions contextuelles
  const generateContextualSuggestions = (module: string, data: any): ContextualSuggestion[] => {
    const suggestions: ContextualSuggestion[] = [];

    switch (module) {
      case 'dashboard':
        suggestions.push(
          { text: "Analyser les KPIs du mois", action: "analyze_kpis", icon: "📊", module },
          { text: "Résumé des projets urgents", action: "urgent_projects", icon: "🚨", module },
          { text: "Performance équipe cette semaine", action: "team_performance", icon: "👥", module }
        );
        break;

      case 'projects':
        const delayedProjects = data.projects?.filter(p => p.status === 'in_progress').length || 0;
        suggestions.push(
          { text: `${delayedProjects} projets nécessitent attention`, action: "analyze_delays", icon: "⏰", module },
          { text: "Optimiser allocation ressources", action: "optimize_resources", icon: "👨‍💼", module },
          { text: "Prédire les échéances", action: "predict_deadlines", icon: "📅", module }
        );
        break;

      case 'hr':
        const totalEmployees = data.employees?.length || 0;
        suggestions.push(
          { text: `Analyser ${totalEmployees} profils employés`, action: "analyze_employees", icon: "👥", module },
          { text: "Détecter besoins recrutement", action: "recruitment_needs", icon: "🆕", module },
          { text: "Évaluer satisfaction équipe", action: "team_satisfaction", icon: "😊", module }
        );
        break;

      case 'business':
        const pendingQuotes = data.devis?.filter(d => d.status === 'pending').length || 0;
        suggestions.push(
          { text: `${pendingQuotes} devis en attente`, action: "review_quotes", icon: "💰", module },
          { text: "Analyser taux conversion", action: "conversion_analysis", icon: "📈", module },
          { text: "Prédire revenus Q2", action: "revenue_prediction", icon: "💎", module }
        );
        break;
    }

    return suggestions;
  };

  // Charger toutes les données contextuelles
  const refreshContext = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const [
        projectsResult,
        employeesResult,
        companiesResult,
        tasksResult,
        devisResult,
        invoicesResult
      ] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('employees').select('*'),
        supabase.from('companies').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('devis').select('*'),
        supabase.from('invoices').select('*')
      ]);

      const newContextData = {
        projects: projectsResult.data || [],
        employees: employeesResult.data || [],
        companies: companiesResult.data || [],
        tasks: tasksResult.data || [],
        devis: devisResult.data || [],
        invoices: invoicesResult.data || [],
        insights: contextData.insights // Conserver les insights existants
      };

      setContextData(newContextData);

      // Générer les suggestions contextuelles
      const currentModule = getCurrentModule();
      const suggestions = generateContextualSuggestions(currentModule, newContextData);
      setContextualSuggestions(suggestions);

    } catch (error) {
      console.error('Erreur lors du chargement du contexte IA:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Ajouter un insight
  const addInsight = (insight: any) => {
    setContextData(prev => ({
      ...prev,
      insights: [...prev.insights, { ...insight, id: Date.now(), timestamp: new Date().toISOString() }]
    }));
  };

  // Rafraîchir le contexte quand l'utilisateur ou la route change
  useEffect(() => {
    refreshContext();
  }, [user, location.pathname]);

  // Mettre à jour les suggestions quand les données changent
  useEffect(() => {
    const currentModule = getCurrentModule();
    const suggestions = generateContextualSuggestions(currentModule, contextData);
    setContextualSuggestions(suggestions);
  }, [contextData, location.pathname]);

  const value: AIContextData = {
    ...contextData,
    currentModule: getCurrentModule(),
    contextualSuggestions,
    isLoading,
    refreshContext,
    addInsight
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};

export const useAIContext = () => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAIContext must be used within an AIContextProvider');
  }
  return context;
};
