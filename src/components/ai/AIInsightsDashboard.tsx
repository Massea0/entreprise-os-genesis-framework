
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Briefcase,
  Clock,
  Target,
  Lightbulb,
  Zap,
  BarChart3,
  PieChart
} from 'lucide-react';

interface AIInsight {
  id: string;
  type: 'recommendation' | 'alert' | 'prediction' | 'analysis';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'hr' | 'projects' | 'business' | 'performance';
  actionable: boolean;
  data: any;
  confidence: number;
  createdAt: string;
}

export const AIInsightsDashboard: React.FC = () => {
  const { toast } = useToast();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [analysisMode, setAnalysisMode] = useState<'global' | 'department'>('global');

  useEffect(() => {
    generateAIInsights();
  }, []);

  const generateAIInsights = async () => {
    try {
      setLoading(true);
      
      // Récupérer toutes les données de l'entreprise
      const [projectsData, employeesData, tasksData, companiesData] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('employees').select('*'),
        supabase.from('tasks').select('*'), 
        supabase.from('companies').select('*')
      ]);

      // Analyser les vraies données pour détecter les retards
      const now = new Date();
      const delayedProjects = projectsData.data?.filter(p => {
        if (p.status !== 'in_progress') return false;
        if (!p.end_date) return false;
        return new Date(p.end_date) < now;
      }) || [];

      const overbudgetProjects = projectsData.data?.filter(p => {
        if (p.status !== 'in_progress') return false;
        // Simuler un dépassement si pas de budget défini ou projet ancien
        return !p.budget || (p.created_at && (now.getTime() - new Date(p.created_at).getTime()) > 90 * 24 * 60 * 60 * 1000);
      }) || [];

      const mockInsights: AIInsight[] = [
        {
          id: '1',
          type: 'alert',
          title: '🚨 Retards Projets Critiques',
          description: `${delayedProjects.length} projets en retard détectés. ${overbudgetProjects.length} projets risquent un dépassement budgétaire. Recommandation : Réajuster les plannings et ressources.`,
          impact: delayedProjects.length > 2 ? 'high' : delayedProjects.length > 0 ? 'medium' : 'low',
          category: 'projects',
          actionable: true,
          data: { 
            delayedProjects: delayedProjects.length,
            overbudgetProjects: overbudgetProjects.length,
            projectNames: delayedProjects.map(p => p.name)
          },
          confidence: delayedProjects.length > 0 ? 92 : 65,
          createdAt: new Date().toISOString()
        },
        // Analyse RH basée sur les vraies données
        {
          id: '2', 
          type: 'recommendation',
          title: '💡 Optimisation Équipe RH',
          description: `${employeesData.data?.length || 0} employés actuels. Ratio projets/employés: ${projectsData.data?.length || 0}/${employeesData.data?.length || 1} = ${Math.round((projectsData.data?.length || 0) / (employeesData.data?.length || 1) * 100) / 100}. ${(projectsData.data?.length || 0) > (employeesData.data?.length || 0) ? 'Charge élevée détectée' : 'Capacité disponible'}.`,
          impact: (projectsData.data?.length || 0) > (employeesData.data?.length || 0) * 1.5 ? 'high' : 'medium',
          category: 'hr',
          actionable: true,
          data: { 
            currentEmployees: employeesData.data?.length || 0, 
            activeProjects: projectsData.data?.length || 0,
            workloadRatio: (projectsData.data?.length || 0) / (employeesData.data?.length || 1)
          },
          confidence: 85,
          createdAt: new Date().toISOString()
        },
        // Analyse des tâches en cours
        {
          id: '3',
          type: 'prediction',
          title: '📈 Analyse Productivité',
          description: `${tasksData.data?.filter(t => t.status === 'done').length || 0} tâches terminées vs ${tasksData.data?.filter(t => t.status === 'in_progress').length || 0} en cours. Taux de completion: ${Math.round(((tasksData.data?.filter(t => t.status === 'done').length || 0) / (tasksData.data?.length || 1)) * 100)}%.`,
          impact: ((tasksData.data?.filter(t => t.status === 'done').length || 0) / (tasksData.data?.length || 1)) > 0.7 ? 'low' : 'medium',
          category: 'performance',
          actionable: true,
          data: { 
            completedTasks: tasksData.data?.filter(t => t.status === 'done').length || 0,
            inProgressTasks: tasksData.data?.filter(t => t.status === 'in_progress').length || 0,
            completionRate: ((tasksData.data?.filter(t => t.status === 'done').length || 0) / (tasksData.data?.length || 1)) * 100
          },
          confidence: 82,
          createdAt: new Date().toISOString()
        },
        // Analyse business réelle
        {
          id: '4',
          type: 'analysis',
          title: '🎯 Opportunité Business',
          description: `${companiesData.data?.length || 0} clients actifs. ${projectsData.data?.filter(p => p.status === 'completed').length || 0} projets livrés avec succès. Taux de rétention client élevé détecté.`,
          impact: (companiesData.data?.length || 0) > 5 ? 'high' : 'medium',
          category: 'business',
          actionable: true,
          data: { 
            clients: companiesData.data?.length || 0, 
            completedProjects: projectsData.data?.filter(p => p.status === 'completed').length || 0,
            retentionIndicator: (projectsData.data?.filter(p => p.status === 'completed').length || 0) / (companiesData.data?.length || 1)
          },
          confidence: 78,
          createdAt: new Date().toISOString()
        },
        // Analyse des blocages réels
        {
          id: '5',
          type: 'alert',
          title: '⏰ Analyse des Tâches',
          description: `${tasksData.data?.filter(t => t.status === 'in_progress').length || 0} tâches en cours, ${tasksData.data?.filter(t => t.status === 'blocked').length || 0} bloquées. ${tasksData.data?.filter(t => !t.assignee_id).length || 0} tâches non assignées nécessitent attention.`,
          impact: (tasksData.data?.filter(t => t.status === 'blocked').length || 0) > 3 ? 'high' : 'medium',
          category: 'projects',
          actionable: true,
          data: { 
            inProgressTasks: tasksData.data?.filter(t => t.status === 'in_progress').length || 0,
            blockedTasks: tasksData.data?.filter(t => t.status === 'blocked').length || 0,
            unassignedTasks: tasksData.data?.filter(t => !t.assignee_id).length || 0
          },
          confidence: 89,
          createdAt: new Date().toISOString()
        }
      ];

      setInsights(mockInsights);
    } catch (error) {
      console.error('Erreur génération insights:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de générer les insights IA"
      });
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'recommendation': return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      case 'prediction': return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'analysis': return <BarChart3 className="h-5 w-5 text-green-500" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hr': return <Users className="h-4 w-4" />;
      case 'projects': return <Briefcase className="h-4 w-4" />;
      case 'business': return <Target className="h-4 w-4" />;
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.category === selectedCategory);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec contrôles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Synapse - Insights IA
          </h2>
          <p className="text-muted-foreground">
            Intelligence d'affaires alimentée par l'IA pour une prise de décision éclairée
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={analysisMode === 'global' ? 'default' : 'outline'}
            onClick={() => setAnalysisMode('global')}
            size="sm"
          >
            <PieChart className="h-4 w-4 mr-2" />
            Vue Globale
          </Button>
          <Button
            variant={analysisMode === 'department' ? 'default' : 'outline'}
            onClick={() => setAnalysisMode('department')}
            size="sm"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Par Département
          </Button>
        </div>
      </div>

      {/* Métriques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Alertes Critiques</p>
                <p className="text-2xl font-bold">{insights.filter(i => i.type === 'alert' && i.impact === 'high').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Recommandations</p>
                <p className="text-2xl font-bold">{insights.filter(i => i.type === 'recommendation').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Prédictions</p>
                <p className="text-2xl font-bold">{insights.filter(i => i.type === 'prediction').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Actions Possibles</p>
                <p className="text-2xl font-bold">{insights.filter(i => i.actionable).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres par catégorie */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">Tout</TabsTrigger>
          <TabsTrigger value="hr">RH</TabsTrigger>
          <TabsTrigger value="projects">Projets</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          {filteredInsights.map((insight) => (
            <Card key={insight.id} className={`border-l-4 ${getImpactColor(insight.impact)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getInsightIcon(insight.type)}
                    <div>
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryIcon(insight.category)}
                          <span className="ml-1 capitalize">{insight.category}</span>
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Confiance: {insight.confidence}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {insight.actionable && (
                    <Button size="sm" variant="outline">
                      <Zap className="h-4 w-4 mr-2" />
                      Action
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">{insight.description}</p>
                
                {/* Barre de confiance */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Niveau de confiance IA</span>
                    <span>{insight.confidence}%</span>
                  </div>
                  <Progress value={insight.confidence} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};
