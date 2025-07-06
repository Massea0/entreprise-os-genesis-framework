import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, DollarSign, Calendar, AlertCircle, Brain, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MetricCard } from '@/components/ui/MetricCard';
import { SynapseInsights } from '@/components/ai/SynapseInsights';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalQuotes: 0,
    pendingAmount: 0,
    paidAmount: 0,
    overdueCount: 0
  });
  const [showAIInsights, setShowAIInsights] = useState(false);

  useEffect(() => {
    loadClientStats();
  }, []);

  const loadClientStats = async () => {
    try {
      const userCompanyId = user?.user_metadata?.company_id;
      if (!userCompanyId) return;

      const [invoicesRes, quotesRes] = await Promise.all([
        supabase.from('invoices').select('amount, status, due_date').eq('company_id', userCompanyId),
        supabase.from('devis').select('amount, status').eq('company_id', userCompanyId)
      ]);

      const invoices = invoicesRes.data || [];
      const quotes = quotesRes.data || [];

      const pendingAmount = invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.amount, 0);
      const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
      const overdueCount = invoices.filter(inv => 
        inv.status === 'overdue' || (inv.status === 'sent' && new Date(inv.due_date) < new Date())
      ).length;

      setStats({
        totalInvoices: invoices.length,
        totalQuotes: quotes.length,
        pendingAmount,
        paidAmount,
        overdueCount
      });
    } catch (error) {
      console.error('Error loading client stats:', error);
    }
  };

  const clientMetrics = [
    {
      title: "Factures à Payer",
      value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(stats.pendingAmount),
      description: "Montant en attente",
      trend: stats.overdueCount > 0 ? `${stats.overdueCount} en retard` : "À jour",
      trendDirection: stats.overdueCount > 0 ? "down" as const : "stable" as const,
      icon: DollarSign,
      color: stats.overdueCount > 0 ? "text-red-600" : "text-blue-600",
      bgColor: stats.overdueCount > 0 ? "bg-red-50 dark:bg-red-950" : "bg-blue-50 dark:bg-blue-950"
    },
    {
      title: "Factures Payées",
      value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(stats.paidAmount),
      description: "Total réglé",
      trend: "+15%",
      trendDirection: "up" as const,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950"
    },
    {
      title: "Devis en Cours",
      value: stats.totalQuotes.toString(),
      description: "Propositions reçues",
      trend: "2 nouveaux",
      trendDirection: "up" as const,
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950"
    },
    {
      title: "Projets Actifs",
      value: "3",
      description: "En cours de réalisation",
      trend: "1 terminé",
      trendDirection: "up" as const,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Mon Espace Client
          </h1>
          <p className="text-muted-foreground">
            Suivi de vos factures, devis et projets - Bienvenue {user?.email}
          </p>
        </div>
        
        <Button 
          onClick={() => setShowAIInsights(!showAIInsights)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Brain className="h-4 w-4 mr-2" />
          {showAIInsights ? 'Vue Standard' : '🧠 Mes Insights'}
        </Button>
      </div>

      {showAIInsights ? (
        <div className="space-y-6">
          <SynapseInsights context="client-dashboard" />
        </div>
      ) : (
        <>
          <SynapseInsights context="client-dashboard" compact={true} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {clientMetrics.map((metric) => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Activité Récente</CardTitle>
                <CardDescription>
                  Vos dernières interactions avec nos services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Facture payée - Projet Web</p>
                    <p className="text-xs text-muted-foreground">Il y a 2 jours</p>
                  </div>
                  <Badge variant="secondary">Payé</Badge>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Nouveau devis reçu</p>
                    <p className="text-xs text-muted-foreground">Il y a 5 jours</p>
                  </div>
                  <Badge variant="secondary">Devis</Badge>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Projet livré</p>
                    <p className="text-xs text-muted-foreground">Il y a 1 semaine</p>
                  </div>
                  <Badge variant="secondary">Livraison</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Actions Prioritaires
                </CardTitle>
                <CardDescription>
                  Ce que vous devez faire maintenant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.overdueCount > 0 && (
                  <div className="p-3 border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">
                        {stats.overdueCount} facture{stats.overdueCount > 1 ? 's' : ''} en retard
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-3">
                  <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                    <FileText className="h-5 w-5 mb-2 text-blue-600" />
                    <div className="text-sm font-medium">Voir mes factures</div>
                    <div className="text-xs text-muted-foreground">{stats.totalInvoices} factures au total</div>
                  </button>
                  <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                    <Calendar className="h-5 w-5 mb-2 text-green-600" />
                    <div className="text-sm font-medium">Mes devis</div>
                    <div className="text-xs text-muted-foreground">{stats.totalQuotes} propositions reçues</div>
                  </button>
                  <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                    <Clock className="h-5 w-5 mb-2 text-purple-600" />
                    <div className="text-sm font-medium">Suivi projets</div>
                    <div className="text-xs text-muted-foreground">3 projets en cours</div>
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