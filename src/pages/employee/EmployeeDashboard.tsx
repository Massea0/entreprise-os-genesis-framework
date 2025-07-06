import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Clock, CheckCircle, Brain, FileText, MessageSquare, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MetricCard } from '@/components/ui/MetricCard';
import { SynapseInsights } from '@/components/ai/SynapseInsights';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [showAIInsights, setShowAIInsights] = useState(false);

  useEffect(() => {
    loadEmployeeData();
  }, []);

  const loadEmployeeData = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          departments(name),
          positions(title),
          branches(name)
        `)
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading employee data:', error);
        return;
      }
      
      setEmployeeData(data);
    } catch (error) {
      console.error('Error loading employee data:', error);
    }
  };

  const employeeMetrics = [
    {
      title: "Jours de Congés",
      value: employeeData ? `${employeeData.vacation_days_used || 0}/${employeeData.vacation_days_total || 30}` : "0/30",
      description: "Utilisés cette année",
      trend: `${30 - (employeeData?.vacation_days_used || 0)} restants`,
      trendDirection: "stable" as const,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950"
    },
    {
      title: "Performance",
      value: employeeData?.performance_score ? `${employeeData.performance_score}/5` : "N/A",
      description: "Score actuel",
      trend: "+0.5 ce mois",
      trendDirection: "up" as const,
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950"
    },
    {
      title: "Tâches du Jour",
      value: "5",
      description: "À compléter",
      trend: "2 terminées",
      trendDirection: "up" as const,
      icon: CheckCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950"
    },
    {
      title: "Équipe",
      value: "12",
      description: "Collègues actifs",
      trend: "Département",
      trendDirection: "stable" as const,
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
            Mon Espace Employé
          </h1>
          <p className="text-muted-foreground">
            {employeeData ? (
              <>Bienvenue {employeeData.first_name} {employeeData.last_name} - {employeeData.positions?.title}</>
            ) : (
              <>Bienvenue dans votre espace personnel - {user?.email}</>
            )}
          </p>
        </div>
        
        <Button 
          onClick={() => setShowAIInsights(!showAIInsights)}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
        >
          <Brain className="h-4 w-4 mr-2" />
          {showAIInsights ? 'Vue Standard' : '🧠 Mon Assistant'}
        </Button>
      </div>

      {showAIInsights ? (
        <div className="space-y-6">
          <SynapseInsights context="employee-dashboard" />
        </div>
      ) : (
        <>
          <SynapseInsights context="employee-dashboard" compact={true} />
          
          {employeeData && (
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardHeader>
                <CardTitle>Informations Personnelles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Département</p>
                    <p className="font-medium">{employeeData.departments?.name || 'Non assigné'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Poste</p>
                    <p className="font-medium">{employeeData.positions?.title || 'Non défini'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Agence</p>
                    <p className="font-medium">{employeeData.branches?.name || 'Siège'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {employeeMetrics.map((metric) => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Activité Récente</CardTitle>
                <CardDescription>
                  Vos dernières actions et notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Tâche complétée: Rapport mensuel</p>
                    <p className="text-xs text-muted-foreground">Il y a 1 heure</p>
                  </div>
                  <Badge variant="secondary">Terminé</Badge>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Réunion d'équipe programmée</p>
                    <p className="text-xs text-muted-foreground">Il y a 3 heures</p>
                  </div>
                  <Badge variant="secondary">Calendrier</Badge>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Nouvelle formation disponible</p>
                    <p className="text-xs text-muted-foreground">Il y a 1 jour</p>
                  </div>
                  <Badge variant="secondary">Formation</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Mes Outils
                </CardTitle>
                <CardDescription>
                  Accès rapide à vos ressources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                    <Calendar className="h-5 w-5 mb-2 text-blue-600" />
                    <div className="text-sm font-medium">Mes Congés</div>
                    <div className="text-xs text-muted-foreground">Planifier</div>
                  </button>
                  <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                    <FileText className="h-5 w-5 mb-2 text-green-600" />
                    <div className="text-sm font-medium">Mes Fiches</div>
                    <div className="text-xs text-muted-foreground">Paie & Admin</div>
                  </button>
                  <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                    <MessageSquare className="h-5 w-5 mb-2 text-purple-600" />
                    <div className="text-sm font-medium">Support RH</div>
                    <div className="text-xs text-muted-foreground">Assistance</div>
                  </button>
                  <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                    <Target className="h-5 w-5 mb-2 text-orange-600" />
                    <div className="text-sm font-medium">Objectifs</div>
                    <div className="text-xs text-muted-foreground">Suivi</div>
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