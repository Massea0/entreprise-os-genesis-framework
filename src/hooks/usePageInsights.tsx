import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface PageInsight {
  id: string;
  pageContext: string;
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info' | 'critical';
  confidence: number;
  timestamp: string;
  data?: any;
}

const INSIGHTS_STORAGE_KEY = 'synapse_page_insights';

export const usePageInsights = () => {
  const location = useLocation();
  const [insights, setInsights] = useState<PageInsight[]>([]);
  const [loading, setLoading] = useState(false);

  const getCurrentPageContext = () => {
    if (location.pathname.includes('/devis') || location.pathname.includes('/business/quotes')) return 'devis';
    if (location.pathname.includes('/projects')) return 'projects';
    if (location.pathname.includes('/invoices') || location.pathname.includes('/business/invoices')) return 'invoices';
    if (location.pathname.includes('/employees') || location.pathname.includes('/hr')) return 'hr';
    if (location.pathname.includes('/dashboard')) return 'dashboard';
    if (location.pathname.includes('/clients') || location.pathname.includes('/business/clients')) return 'clients';
    return 'general';
  };

  const getStoredInsights = () => {
    try {
      const stored = localStorage.getItem(INSIGHTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Erreur lecture insights stockés:', error);
      return {};
    }
  };

  const storeInsights = (pageContext: string, pageInsights: PageInsight[]) => {
    try {
      const stored = getStoredInsights();
      stored[pageContext] = {
        insights: pageInsights,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(INSIGHTS_STORAGE_KEY, JSON.stringify(stored));
    } catch (error) {
      console.error('Erreur stockage insights:', error);
    }
  };

  const generatePageSpecificInsights = async (pageContext: string): Promise<PageInsight[]> => {
    const newInsights: PageInsight[] = [];

    try {
      console.log(`Generating insights for context: ${pageContext}`);
      
      switch (pageContext) {
        case 'devis':
          console.log('Fetching devis data...');
          const { data: devisData, error: devisError } = await supabase.from('devis').select('*').limit(50);
          console.log('Devis data:', devisData, 'Error:', devisError);
          if (devisData && devisData.length > 0) {
            const pendingDevis = devisData.filter(d => d.status === 'sent' || d.status === 'pending');
            const acceptedDevis = devisData.filter(d => d.status === 'approved');
            const totalValue = devisData.reduce((sum, d) => sum + (d.amount || 0), 0);
            
            if (pendingDevis.length > 0) {
              newInsights.push({
                id: `devis-pending-${Date.now()}`,
                pageContext: 'devis',
                title: `💼 ${pendingDevis.length} devis en attente`,
                description: `Valeur totale: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(pendingDevis.reduce((sum, d) => sum + (d.amount || 0), 0))}`,
                type: 'warning',
                confidence: 0.95,
                timestamp: new Date().toISOString(),
                data: { pendingCount: pendingDevis.length, pendingValue: pendingDevis.reduce((sum, d) => sum + (d.amount || 0), 0) }
              });
            }

            if (acceptedDevis.length > 0) {
              newInsights.push({
                id: `devis-success-${Date.now()}`,
                pageContext: 'devis',
                title: `✅ ${acceptedDevis.length} devis acceptés`,
                description: `Taux de conversion: ${Math.round(acceptedDevis.length / devisData.length * 100)}%`,
                type: 'success',
                confidence: 0.90,
                timestamp: new Date().toISOString(),
                data: { acceptedCount: acceptedDevis.length, conversionRate: acceptedDevis.length / devisData.length }
              });
            }

            newInsights.push({
              id: `devis-overview-${Date.now()}`,
              pageContext: 'devis',
              title: `📊 Portfolio devis actuel`,
              description: `${devisData.length} devis totaux, valeur: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(totalValue)}`,
              type: 'info',
              confidence: 1.0,
              timestamp: new Date().toISOString(),
              data: { totalCount: devisData.length, totalValue }
            });
          }
          break;

        case 'projects':
          console.log('Fetching projects data...');
          const { data: projectsData, error: projectsError } = await supabase.from('projects').select('*').limit(50);
          console.log('Projects data:', projectsData, 'Error:', projectsError);
          
          if (projectsData && projectsData.length > 0) {
            const activeProjects = projectsData.filter(p => p.status === 'active' || p.status === 'in_progress');
            const completedProjects = projectsData.filter(p => p.status === 'completed');
            
            newInsights.push({
              id: `projects-active-${Date.now()}`,
              pageContext: 'projects',
              title: `🚀 ${activeProjects.length} projets actifs`,
              description: `Performance élevée détectée. ${completedProjects.length} projets terminés avec succès.`,
              type: activeProjects.length > 0 ? 'success' : 'info',
              confidence: 0.92,
              timestamp: new Date().toISOString(),
              data: { activeCount: activeProjects.length, completedCount: completedProjects.length }
            });
          } else {
            // Générer un insight même sans données
            newInsights.push({
              id: `projects-empty-${Date.now()}`,
              pageContext: 'projects',
              title: `📋 Aucun projet trouvé`,
              description: `Commencez par créer votre premier projet pour suivre l'avancement.`,
              type: 'info',
              confidence: 1.0,
              timestamp: new Date().toISOString(),
              data: { activeCount: 0, totalCount: 0 }
            });
          }
          break;

        case 'invoices':
          console.log('Fetching invoices data...');
          const { data: invoicesData, error: invoicesError } = await supabase.from('invoices').select('*').limit(50);
          console.log('Invoices data:', invoicesData, 'Error:', invoicesError);
          
          if (invoicesData && invoicesData.length > 0) {
            const unpaidInvoices = invoicesData.filter(i => i.status === 'sent' || i.status === 'pending');
            const overdueInvoices = invoicesData.filter(i => 
              (i.status === 'sent' || i.status === 'pending') && 
              new Date(i.due_date) < new Date()
            );
            
            if (overdueInvoices.length > 0) {
              newInsights.push({
                id: `invoices-overdue-${Date.now()}`,
                pageContext: 'invoices',
                title: `🚨 ${overdueInvoices.length} factures en retard`,
                description: `Action requise pour le recouvrement. Montant total en souffrance.`,
                type: 'critical',
                confidence: 1.0,
                timestamp: new Date().toISOString(),
                data: { overdueCount: overdueInvoices.length }
              });
            } else {
              newInsights.push({
                id: `invoices-status-${Date.now()}`,
                pageContext: 'invoices',
                title: `💰 ${invoicesData.length} factures`,
                description: `${unpaidInvoices.length} en attente de paiement, ${invoicesData.length - unpaidInvoices.length} payées.`,
                type: unpaidInvoices.length > 0 ? 'warning' : 'success',
                confidence: 0.9,
                timestamp: new Date().toISOString(),
                data: { unpaidCount: unpaidInvoices.length, totalCount: invoicesData.length }
              });
            }
          } else {
            // Générer un insight même sans données
            newInsights.push({
              id: `invoices-empty-${Date.now()}`,
              pageContext: 'invoices',
              title: `📄 Aucune facture trouvée`,
              description: `Commencez par créer vos premières factures.`,
              type: 'info',
              confidence: 1.0,
              timestamp: new Date().toISOString(),
              data: { totalCount: 0 }
            });
          }
          break;

        case 'hr':
          console.log('Fetching employees data...');
          const { data: employeesData, error: employeesError } = await supabase.from('employees').select('*').limit(100);
          console.log('Employees data:', employeesData, 'Error:', employeesError);
          
          if (employeesData && employeesData.length > 0) {
            const activeEmployees = employeesData.filter(e => e.employment_status === 'active');
            const avgPerformance = activeEmployees.length > 0 
              ? activeEmployees.reduce((sum, e) => sum + (e.performance_score || 0), 0) / activeEmployees.length 
              : 0;
            
            newInsights.push({
              id: `hr-performance-${Date.now()}`,
              pageContext: 'hr',
              title: `👥 ${activeEmployees.length} employés actifs`,
              description: `Score de performance moyen: ${avgPerformance.toFixed(1)}/10. ${employeesData.length - activeEmployees.length} inactifs.`,
              type: avgPerformance > 7 ? 'success' : activeEmployees.length > 0 ? 'info' : 'warning',
              confidence: 0.88,
              timestamp: new Date().toISOString(),
              data: { activeCount: activeEmployees.length, totalCount: employeesData.length, avgPerformance }
            });
          } else {
            // Générer un insight même sans données
            newInsights.push({
              id: `hr-empty-${Date.now()}`,
              pageContext: 'hr',
              title: `👥 Aucun employé trouvé`,
              description: `Commencez par ajouter vos employés dans le système RH.`,
              type: 'info',
              confidence: 1.0,
              timestamp: new Date().toISOString(),
              data: { activeCount: 0, totalCount: 0 }
            });
          }
          break;

        case 'dashboard':
          console.log('Generating dashboard synthesis...');
          // Le dashboard synthétise les insights de toutes les pages
          const storedInsights = getStoredInsights();
          const allPageInsights: PageInsight[] = [];
          
          Object.keys(storedInsights).forEach(page => {
            if (page !== 'dashboard' && storedInsights[page]?.insights) {
              allPageInsights.push(...storedInsights[page].insights);
            }
          });

          console.log('Dashboard stored insights:', storedInsights);
          console.log('All page insights for dashboard:', allPageInsights);

          if (allPageInsights.length > 0) {
            const criticalInsights = allPageInsights.filter(i => i.type === 'critical').length;
            const warningInsights = allPageInsights.filter(i => i.type === 'warning').length;
            const successInsights = allPageInsights.filter(i => i.type === 'success').length;
            
            newInsights.push({
              id: `dashboard-synthesis-${Date.now()}`,
              pageContext: 'dashboard',
              title: `🎯 Synthèse globale`,
              description: `${allPageInsights.length} insights analysés : ${criticalInsights} critiques, ${warningInsights} alertes, ${successInsights} positifs`,
              type: criticalInsights > 0 ? 'critical' : warningInsights > 0 ? 'warning' : 'success',
              confidence: 0.95,
              timestamp: new Date().toISOString(),
              data: { totalInsights: allPageInsights.length, critical: criticalInsights, warnings: warningInsights, success: successInsights }
            });
          } else {
            // Générer un insight même sans données
            newInsights.push({
              id: `dashboard-empty-${Date.now()}`,
              pageContext: 'dashboard',
              title: `📊 Tableau de bord`,
              description: `Visitez les autres pages (devis, projets, factures, RH) pour générer des analyses.`,
              type: 'info',
              confidence: 1.0,
              timestamp: new Date().toISOString(),
              data: { totalInsights: 0 }
            });
          }
          break;
        default:
          // Générer un insight générique pour les pages non spécifiques
          newInsights.push({
            id: `general-${Date.now()}`,
            pageContext: pageContext,
            title: `🔍 Page ${pageContext}`,
            description: `Analyse contextuelle disponible. Explorez les fonctionnalités disponibles.`,
            type: 'info',
            confidence: 0.7,
            timestamp: new Date().toISOString(),
            data: { context: pageContext }
          });
          break;
      }
    } catch (error) {
      console.error('Erreur génération insights:', error);
      
      // Générer un insight d'erreur pour debug
      newInsights.push({
        id: `error-${Date.now()}`,
        pageContext: pageContext,
        title: `⚠️ Erreur d'analyse`,
        description: `Impossible de générer les insights pour ${pageContext}. Vérifiez les permissions.`,
        type: 'warning',
        confidence: 1.0,
        timestamp: new Date().toISOString(),
        data: { error: error.message, context: pageContext }
      });
    }

    return newInsights;
  };

  const refreshInsights = async () => {
    setLoading(true);
    const pageContext = getCurrentPageContext();
    
    try {
      const newInsights = await generatePageSpecificInsights(pageContext);
      setInsights(newInsights);
      storeInsights(pageContext, newInsights);
    } catch (error) {
      console.error('Erreur refresh insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStoredInsights = () => {
    const pageContext = getCurrentPageContext();
    const stored = getStoredInsights();
    
    if (stored[pageContext]?.insights) {
      setInsights(stored[pageContext].insights);
    } else {
      // Générer automatiquement si pas d'insights stockés
      refreshInsights();
    }
  };

  const getAllStoredInsights = () => {
    return getStoredInsights();
  };

  const clearInsights = (pageContext?: string) => {
    if (pageContext) {
      const stored = getStoredInsights();
      delete stored[pageContext];
      localStorage.setItem(INSIGHTS_STORAGE_KEY, JSON.stringify(stored));
      
      if (getCurrentPageContext() === pageContext) {
        setInsights([]);
      }
    } else {
      localStorage.removeItem(INSIGHTS_STORAGE_KEY);
      setInsights([]);
    }
  };

  useEffect(() => {
    loadStoredInsights();
  }, [location.pathname]);

  return {
    insights,
    loading,
    currentPageContext: getCurrentPageContext(),
    refreshInsights,
    getAllStoredInsights,
    clearInsights
  };
};