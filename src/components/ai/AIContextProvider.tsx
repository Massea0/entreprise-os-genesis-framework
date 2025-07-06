
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
    const userRole = user?.user_metadata?.role || 'client';
    
    if (path.includes('/dashboard')) {
      if (userRole === 'admin' || userRole === 'super_admin') return 'admin-dashboard';
      if (userRole === 'client') return 'client-dashboard';
      return 'dashboard';
    }
    if (path.includes('/projects')) return 'projects';
    if (path.includes('/hr')) return 'hr';
    if (path.includes('/business')) return 'business';
    if (path.includes('/synapse')) return 'synapse';
    return 'general';
  };

  // Générer des suggestions contextuelles basées sur les vraies données
  const generateContextualSuggestions = (module: string, data: any): ContextualSuggestion[] => {
    const suggestions: ContextualSuggestion[] = [];

    switch (module) {
      case 'dashboard':
      case 'admin-dashboard':
        const totalProjects = data.projects?.length || 0;
        const activeProjects = data.projects?.filter(p => p.status === 'in_progress').length || 0;
        const totalRevenue = data.invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0) || 0;
        
        suggestions.push(
          { text: `Analyser ${totalProjects} projets (${activeProjects} actifs)`, action: "analyze_projects", icon: "📊", module },
          { text: `CA réalisé: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(totalRevenue)}`, action: "revenue_analysis", icon: "💰", module },
          { text: "Prédire performances Q2", action: "predict_performance", icon: "🔮", module }
        );
        break;

      case 'client-dashboard':
        const clientInvoices = data.invoices?.length || 0;
        const clientQuotes = data.devis?.length || 0;
        const clientProjects = data.projects?.length || 0;
        
        suggestions.push(
          { text: `${clientInvoices} factures à suivre`, action: "review_invoices", icon: "📋", module },
          { text: `${clientQuotes} devis reçus`, action: "review_quotes", icon: "💼", module },
          { text: `${clientProjects} projets en cours`, action: "track_projects", icon: "🚀", module }
        );
        break;

      case 'projects':
        const delayedProjects = data.projects?.filter(p => p.status === 'in_progress' && new Date(p.end_date) < new Date()).length || 0;
        const totalTasks = data.tasks?.length || 0;
        const pendingTasks = data.tasks?.filter(t => t.status === 'todo').length || 0;
        
        suggestions.push(
          { text: `${delayedProjects} projets en retard`, action: "analyze_delays", icon: "⚠️", module },
          { text: `${pendingTasks}/${totalTasks} tâches en attente`, action: "optimize_tasks", icon: "✅", module },
          { text: "Réorganiser les priorités", action: "reorganize_priorities", icon: "📈", module }
        );
        break;

      case 'hr':
        const totalEmployees = data.employees?.length || 0;
        const activeEmployees = data.employees?.filter(e => e.employment_status === 'active').length || 0;
        
        suggestions.push(
          { text: `${activeEmployees}/${totalEmployees} employés actifs`, action: "analyze_workforce", icon: "👥", module },
          { text: "Évaluer charge de travail", action: "workload_analysis", icon: "⚖️", module },
          { text: "Identifier talents émergents", action: "talent_detection", icon: "⭐", module }
        );
        break;

      case 'business':
        const pendingQuotes = data.devis?.filter(d => d.status === 'sent' || d.status === 'pending').length || 0;
        const paidInvoices = data.invoices?.filter(i => i.status === 'paid').length || 0;
        const totalAmount = data.invoices?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0;
        
        suggestions.push(
          { text: `${pendingQuotes} devis à suivre`, action: "follow_quotes", icon: "📝", module },
          { text: `${paidInvoices} factures payées`, action: "payment_analysis", icon: "✅", module },
          { text: `CA total: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(totalAmount)}`, action: "revenue_breakdown", icon: "💎", module }
        );
        break;

      default:
        suggestions.push(
          { text: "Analyser l'activité globale", action: "global_analysis", icon: "🌍", module },
          { text: "Suggestions personnalisées", action: "personalized_insights", icon: "🎯", module }
        );
    }

    return suggestions;
  };

  // Charger toutes les données contextuelles selon le rôle utilisateur
  const refreshContext = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const userRole = user?.user_metadata?.role || 'client';
      const userCompanyId = user?.user_metadata?.company_id;

      // Debug: log les valeurs pour identifier le problème
      console.log('AIContextProvider - User role:', userRole);
      console.log('AIContextProvider - User company ID:', userCompanyId);
      console.log('AIContextProvider - User ID:', user.id);

      let projectsData, employeesData, companiesData, tasksData, devisData, invoicesData;

      if (userRole === 'admin' || userRole === 'super_admin') {
        // Admin : accès à toutes les données
        const results = await Promise.all([
          supabase.from('projects').select('*').limit(100),
          supabase.from('employees').select('*').limit(200),
          supabase.from('companies').select('*').limit(50),
          supabase.from('tasks').select('*').limit(500),
          supabase.from('devis').select('*').limit(100),
          supabase.from('invoices').select('*').limit(100)
        ]);
        
        [projectsData, employeesData, companiesData, tasksData, devisData, invoicesData] = results;
      } else if (userRole === 'client' && userCompanyId) {
        // Client : seulement ses données (uniquement si company_id existe)
        const results = await Promise.all([
          supabase.from('projects').select('*').eq('client_company_id', userCompanyId),
          Promise.resolve({ data: [] }),
          supabase.from('companies').select('*').eq('id', userCompanyId),
          supabase.from('tasks').select('*').limit(50),
          supabase.from('devis').select('*').eq('company_id', userCompanyId),
          supabase.from('invoices').select('*').eq('company_id', userCompanyId)
        ]);
        
        [projectsData, employeesData, companiesData, tasksData, devisData, invoicesData] = results;
      } else if (userRole === 'client' && !userCompanyId) {
        // Client sans company_id : données vides pour éviter les erreurs
        console.warn('Client user without company_id, returning empty data');
        [projectsData, employeesData, companiesData, tasksData, devisData, invoicesData] = [
          { data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }
        ];
      } else {
        // Employé : données limitées
        const results = await Promise.all([
          supabase.from('projects').select('*').limit(50),
          supabase.from('employees').select('*').limit(100),
          supabase.from('companies').select('*').limit(20),
          supabase.from('tasks').select('*').eq('assignee_id', user.id),
          Promise.resolve({ data: [] }),
          Promise.resolve({ data: [] })
        ]);
        
        [projectsData, employeesData, companiesData, tasksData, devisData, invoicesData] = results;
      }

      const newContextData = {
        projects: projectsData.data || [],
        employees: employeesData.data || [],
        companies: companiesData.data || [],
        tasks: tasksData.data || [],
        devis: devisData.data || [],
        invoices: invoicesData.data || [],
        insights: contextData.insights
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

  // Mise à jour temps réel des données toutes les 30 secondes
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Rafraîchissement automatique des données IA');
      refreshContext();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [user]);

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
