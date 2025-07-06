
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, FileText, MessageSquare, TrendingUp, Brain, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MetricCard } from '@/components/ui/MetricCard';
import { AIInsightsDashboard } from '@/components/ai/AIInsightsDashboard';
import { SynapseInsights } from '@/components/ai/SynapseInsights';
import { useState } from 'react';

export default function Dashboard() {
  const { user } = useAuth();
  const userRole = user?.user_metadata?.role || 'client';
  const [showAIInsights, setShowAIInsights] = useState(false);

  const stats = [
    {
      title: "Employés Actifs",
      value: "8",
      description: "Personnel en service",
      trend: "+2.5%",
      trendDirection: "up" as const,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      roles: ['admin', 'hr_manager']
    },
    {
      title: "Factures en Attente",
      value: "12",
      description: "À traiter ce mois",
      trend: "-8.1%",
      trendDirection: "down" as const,
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      roles: ['admin', 'client']
    },
    {
      title: "Tickets Ouverts",
      value: "3",
      description: "Support en cours",
      trend: "0%",
      trendDirection: "stable" as const,
      icon: MessageSquare,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      roles: ['admin', 'hr_manager', 'client']
    },
    {
      title: "Performance",
      value: "94%",
      description: "Score global équipe",
      trend: "+5%",
      trendDirection: "up" as const,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      roles: ['admin', 'hr_manager']
    }
  ];

  const filteredStats = stats.filter(stat => stat.roles.includes(userRole));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Bienvenue dans Arcadis Entreprise OS - votre solution de gestion complète
          </p>
        </div>
        
        {/* Bouton Insights IA */}
        <Button 
          onClick={() => setShowAIInsights(!showAIInsights)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Brain className="h-4 w-4 mr-2" />
          {showAIInsights ? 'Vue Standard' : '🧠 Synapse Insights'}
        </Button>
      </div>

      {/* Vue Insights IA ou Dashboard Standard */}
      {showAIInsights ? (
        <div className="space-y-6">
          <SynapseInsights context="dashboard" />
          <AIInsightsDashboard />
        </div>
      ) : (
        <>
          {/* Synapse Insights Compact */}
          <SynapseInsights context="dashboard" compact={true} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredStats.map((stat) => (
              <MetricCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                description={stat.description}
                trend={stat.trend}
                trendDirection={stat.trendDirection}
                icon={stat.icon}
                color={stat.color}
                bgColor={stat.bgColor}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Activité Récente</CardTitle>
                <CardDescription>
                  Dernières actions dans votre espace de travail
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Nouvel employé ajouté</p>
                    <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
                  </div>
                  <Badge variant="secondary">RH</Badge>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Facture générée</p>
                    <p className="text-xs text-muted-foreground">Il y a 4 heures</p>
                  </div>
                  <Badge variant="secondary">Business</Badge>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Ticket support résolu</p>
                    <p className="text-xs text-muted-foreground">Il y a 6 heures</p>
                  </div>
                  <Badge variant="secondary">Support</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Actions Rapides IA
                </CardTitle>
                <CardDescription>
                  Raccourcis intelligents alimentés par Synapse
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => setShowAIInsights(true)}
                  className="w-full justify-start bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Voir Insights & Recommandations IA
                </Button>
                
                {userRole === 'admin' || userRole === 'hr_manager' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                      <Users className="h-5 w-5 mb-2 text-blue-600" />
                      <div className="text-sm font-medium">Ajouter Employé</div>
                    </button>
                    <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                      <FileText className="h-5 w-5 mb-2 text-green-600" />
                      <div className="text-sm font-medium">Nouveau Rapport</div>
                    </button>
                  </div>
                ) : null}
                
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                    <MessageSquare className="h-5 w-5 mb-2 text-orange-600" />
                    <div className="text-sm font-medium">Créer Ticket</div>
                  </button>
                  <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                    <TrendingUp className="h-5 w-5 mb-2 text-purple-600" />
                    <div className="text-sm font-medium">Voir Analytics</div>
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
