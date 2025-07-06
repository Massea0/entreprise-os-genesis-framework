import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, FileText, MessageSquare, TrendingUp, Brain, Sparkles, Building2, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MetricCard } from '@/components/ui/MetricCard';
import { AIInsightsDashboard } from '@/components/ai/AIInsightsDashboard';
import { SynapseInsights } from '@/components/ai/SynapseInsights';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalClients: 0,
    totalInvoices: 0,
    totalQuotes: 0,
    totalEmployees: 0,
    revenue: 0,
    pendingInvoices: 0
  });
  const [showAIInsights, setShowAIInsights] = useState(false);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      const [companiesRes, invoicesRes, quotesRes, employeesRes] = await Promise.all([
        supabase.from('companies').select('id'),
        supabase.from('invoices').select('amount, status'),
        supabase.from('devis').select('amount, status'),
        supabase.from('employees').select('id')
      ]);

      const totalRevenue = invoicesRes.data?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0) || 0;
      const pendingAmount = invoicesRes.data?.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.amount, 0) || 0;

      setStats({
        totalClients: companiesRes.data?.length || 0,
        totalInvoices: invoicesRes.data?.length || 0,
        totalQuotes: quotesRes.data?.length || 0,
        totalEmployees: employeesRes.data?.length || 0,
        revenue: totalRevenue,
        pendingInvoices: pendingAmount
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
    }
  };

  const adminMetrics = [
    {
      title: "Clients Totaux",
      value: stats.totalClients.toString(),
      description: "Entreprises clientes",
      trend: "+12%",
      trendDirection: "up" as const,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950"
    },
    {
      title: "Chiffre d'Affaires",
      value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(stats.revenue),
      description: "Factures payées",
      trend: "+23%",
      trendDirection: "up" as const,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950"
    },
    {
      title: "Factures en Attente",
      value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(stats.pendingInvoices),
      description: "À encaisser",
      trend: "-5%",
      trendDirection: "down" as const,
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950"
    },
    {
      title: "Équipe",
      value: stats.totalEmployees.toString(),
      description: "Employés actifs",
      trend: "+8%",
      trendDirection: "up" as const,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard Admin
          </h1>
          <p className="text-muted-foreground">
            Vue d'ensemble complète de l'activité - Bienvenue {user?.email}
          </p>
        </div>
        
        <Button 
          onClick={() => setShowAIInsights(!showAIInsights)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Brain className="h-4 w-4 mr-2" />
          {showAIInsights ? 'Vue Standard' : '🧠 Synapse Insights'}
        </Button>
      </div>

      {showAIInsights ? (
        <div className="space-y-6">
          <SynapseInsights context="admin-dashboard" />
          <AIInsightsDashboard />
        </div>
      ) : (
        <>
          <SynapseInsights context="admin-dashboard" compact={true} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {adminMetrics.map((metric) => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Activité Récente Admin</CardTitle>
                <CardDescription>
                  Dernières actions système critiques
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Facture en retard détectée</p>
                    <p className="text-xs text-muted-foreground">Il y a 1 heure</p>
                  </div>
                  <Badge variant="destructive">Urgent</Badge>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Nouveau client enregistré</p>
                    <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
                  </div>
                  <Badge variant="secondary">Business</Badge>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Rapport financier généré</p>
                    <p className="text-xs text-muted-foreground">Il y a 4 heures</p>
                  </div>
                  <Badge variant="secondary">Finance</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Centre de Contrôle IA
                </CardTitle>
                <CardDescription>
                  Outils d'administration intelligents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => setShowAIInsights(true)}
                  className="w-full justify-start bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Analyse Globale IA
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                    <TrendingUp className="h-5 w-5 mb-2 text-green-600" />
                    <div className="text-sm font-medium">Prévisions</div>
                  </button>
                  <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                    <MessageSquare className="h-5 w-5 mb-2 text-blue-600" />
                    <div className="text-sm font-medium">Support IA</div>
                  </button>
                  <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                    <FileText className="h-5 w-5 mb-2 text-orange-600" />
                    <div className="text-sm font-medium">Rapports Auto</div>
                  </button>
                  <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                    <Users className="h-5 w-5 mb-2 text-purple-600" />
                    <div className="text-sm font-medium">RH Insights</div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}