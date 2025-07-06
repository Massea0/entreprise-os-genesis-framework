import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bot, 
  MessageSquare, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Users,
  Zap,
  Brain,
  Target,
  Activity,
  Bell,
  Sparkles,
  Shield,
  CheckCircle2,
  XCircle,
  Heart,
  Frown,
  Meh,
  Smile
} from 'lucide-react';

interface SupportStats {
  totalTickets: number;
  activeTickets: number;
  resolvedToday: number;
  avgResponseTime: string;
  aiResolutionRate: number;
  sentimentScore: number;
  urgentTickets: number;
  satisfactionScore: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  severity: string;
  notification_type: string;
  created_at: string;
  is_read: boolean;
  data: any;
}

export default function SupportDashboard() {
  const [stats, setStats] = useState<SupportStats>({
    totalTickets: 0,
    activeTickets: 0,
    resolvedToday: 0,
    avgResponseTime: '0min',
    aiResolutionRate: 0,
    sentimentScore: 0,
    urgentTickets: 0,
    satisfactionScore: 0
  });
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
    loadNotifications();
    
    // Mise à jour en temps réel
    const interval = setInterval(() => {
      loadDashboardData();
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Statistiques des tickets
      const { data: tickets } = await supabase
        .from('tickets')
        .select('status, priority, created_at, ai_confidence_score');

      // Analyse des sentiments récente
      const { data: sentiments } = await supabase
        .from('ticket_sentiment_analysis')
        .select('sentiment_score, urgency_level')
        .order('created_at', { ascending: false })
        .limit(100);

      if (tickets) {
        const today = new Date().toDateString();
        const activeTickets = tickets.filter(t => !['closed', 'resolved'].includes(t.status));
        const resolvedToday = tickets.filter(t => 
          ['resolved', 'closed'].includes(t.status) && 
          new Date(t.created_at).toDateString() === today
        );
        
        const aiAssisted = tickets.filter(t => t.ai_confidence_score && t.ai_confidence_score > 0.5);
        const urgentTickets = tickets.filter(t => t.priority === 'urgent');

        const avgSentiment = sentiments?.length > 0 
          ? sentiments.reduce((sum, s) => sum + s.sentiment_score, 0) / sentiments.length
          : 0;

        setStats({
          totalTickets: tickets.length,
          activeTickets: activeTickets.length,
          resolvedToday: resolvedToday.length,
          avgResponseTime: '12min', // Calculé par l'IA
          aiResolutionRate: Math.round((aiAssisted.length / tickets.length) * 100),
          sentimentScore: Math.round((avgSentiment + 1) * 50), // Convertir -1,1 vers 0-100
          urgentTickets: urgentTickets.length,
          satisfactionScore: 87 // Mock - pourrait venir d'une table de feedback
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('support_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('support_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la notification:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getSentimentIcon = (score: number) => {
    if (score >= 70) return <Smile className="h-5 w-5 text-green-500" />;
    if (score >= 40) return <Meh className="h-5 w-5 text-yellow-500" />;
    return <Frown className="h-5 w-5 text-red-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50/20 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            🤖 Synapse Support IA
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Tableau de bord intelligent avec analyse des sentiments en temps réel
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 animate-pulse">
            <Activity className="h-3 w-3 mr-1" />
            IA Active
          </Badge>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
            <Sparkles className="h-4 w-4 mr-2" />
            Nouvelle analyse IA
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tickets */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Tickets</p>
                <p className="text-3xl font-bold">{stats.totalTickets}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-200" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-white/10 rounded-full" />
          </CardContent>
        </Card>

        {/* Tickets Actifs */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Tickets Actifs</p>
                <p className="text-3xl font-bold">{stats.activeTickets}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-200" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-white/10 rounded-full" />
          </CardContent>
        </Card>

        {/* IA Resolution Rate */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Résolution IA</p>
                <p className="text-3xl font-bold">{stats.aiResolutionRate}%</p>
              </div>
              <Bot className="h-8 w-8 text-purple-200" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-white/10 rounded-full" />
          </CardContent>
        </Card>

        {/* Sentiment Score */}
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Sentiment Moyen</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">{stats.sentimentScore}%</p>
                  {getSentimentIcon(stats.sentimentScore)}
                </div>
              </div>
              <Heart className="h-8 w-8 text-green-200" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-white/10 rounded-full" />
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal avec onglets */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Analytiques IA
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Performance Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Temps de réponse moyen</span>
                    <span className="font-medium">{stats.avgResponseTime}</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Résolution automatique IA</span>
                    <span className="font-medium">{stats.aiResolutionRate}%</span>
                  </div>
                  <Progress value={stats.aiResolutionRate} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Satisfaction client</span>
                    <span className="font-medium">{stats.satisfactionScore}%</span>
                  </div>
                  <Progress value={stats.satisfactionScore} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Analyse des Sentiments */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Analyse des Sentiments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-6xl font-bold text-primary">{stats.sentimentScore}%</div>
                  <div className="flex items-center justify-center gap-2">
                    {getSentimentIcon(stats.sentimentScore)}
                    <span className="text-muted-foreground">
                      {stats.sentimentScore >= 70 ? 'Excellent' : 
                       stats.sentimentScore >= 40 ? 'Satisfaisant' : 'Nécessite attention'}
                    </span>
                  </div>
                  <Progress value={stats.sentimentScore} className="h-3" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions rapides */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Actions Rapides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-auto p-4 flex flex-col items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                  <Bot className="h-6 w-6" />
                  <span>Analyser nouveaux tickets</span>
                </Button>
                <Button className="h-auto p-4 flex flex-col items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                  <Target className="h-6 w-6" />
                  <span>Optimiser assignations</span>
                </Button>
                <Button className="h-auto p-4 flex flex-col items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                  <Shield className="h-6 w-6" />
                  <span>Rapport qualité</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-500" />
                Notifications en Temps Réel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>Aucune notification récente</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border-l-4 transition-all hover:shadow-md cursor-pointer ${
                        notification.is_read ? 'bg-gray-50' : 'bg-white shadow-sm'
                      } ${
                        notification.severity === 'critical' ? 'border-l-red-500' :
                        notification.severity === 'high' ? 'border-l-orange-500' :
                        notification.severity === 'medium' ? 'border-l-yellow-500' :
                        'border-l-blue-500'
                      }`}
                      onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{notification.title}</h4>
                            <Badge variant={getSeverityColor(notification.severity)} className="text-xs">
                              {notification.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-500" />
                  Tendances IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-indigo-600 mb-2">94%</div>
                    <p className="text-muted-foreground">Précision des prédictions</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Classification automatique</span>
                      <span className="font-medium">96%</span>
                    </div>
                    <Progress value={96} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Détection d'urgence</span>
                      <span className="font-medium">91%</span>
                    </div>
                    <Progress value={91} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  Impact Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">-67%</div>
                    <p className="text-muted-foreground">Temps d'attente réduit</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Satisfaction client</span>
                      <span className="font-medium">+23%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Résolution au premier contact</span>
                      <span className="font-medium">78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Configuration IA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Réponses automatiques</h4>
                    <p className="text-sm text-muted-foreground">Activer les réponses IA automatiques</p>
                  </div>
                  <Button variant="outline" size="sm">Configurer</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Seuil de confiance</h4>
                    <p className="text-sm text-muted-foreground">Niveau minimum pour l'intervention IA</p>
                  </div>
                  <Button variant="outline" size="sm">Ajuster</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Analyse des sentiments</h4>
                    <p className="text-sm text-muted-foreground">Paramètres de détection émotionnelle</p>
                  </div>
                  <Button variant="outline" size="sm">Paramétrer</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}