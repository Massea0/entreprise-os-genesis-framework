import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SupportDashboard from '@/components/support/SupportDashboard';
import TicketView from '@/components/support/TicketView';
import {
  Search,
  Filter,
  Bot,
  Users,
  Settings,
  Eye,
  MessageSquare,
  Clock,
  TrendingUp,
  AlertTriangle,
  Shield,
  Activity,
  Brain,
  Sparkles,
  Target,
  Heart,
  Zap
} from 'lucide-react';

interface Ticket {
  id: string;
  number: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  companies?: { name: string };
  ai_confidence_score?: number;
  sentiment_trend?: any;
}

interface Agent {
  id: string;
  user_id: string;
  specializations: string[];
  current_active_tickets: number;
  max_concurrent_tickets: number;
  availability_status: string;
  total_tickets_handled: number;
  satisfaction_rating: number;
  is_ai_assisted: boolean;
  employees?: {
    first_name: string;
    last_name: string;
  };
}

export default function SupportAdmin() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { toast } = useToast();

  useEffect(() => {
    loadTickets();
    loadAgents();
  }, []);

  const loadTickets = async () => {
    try {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          companies (name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des tickets:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les tickets"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('support_agents')
        .select(`
          *,
          employees (first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des agents:', error);
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.companies?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'in_progress': return 'secondary';
      case 'resolved': return 'outline';
      case 'closed': return 'outline';
      default: return 'secondary';
    }
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'default';
      case 'busy': return 'secondary';
      case 'offline': return 'outline';
      default: return 'secondary';
    }
  };

  const runBulkAIAnalysis = async () => {
    toast({
      title: "🤖 Analyse IA en cours",
      description: "Synapse analyse tous les nouveaux tickets..."
    });

    // Simuler l'analyse IA bulk
    setTimeout(() => {
      toast({
        title: "✅ Analyse terminée",
        description: "Tous les tickets ont été analysés et catégorisés"
      });
      loadTickets();
    }, 3000);
  };

  if (selectedTicket) {
    return (
      <TicketView 
        ticketId={selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
      />
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50/20 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            🛡️ Administration Support IA
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Gestion avancée du support client avec intelligence artificielle
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={runBulkAIAnalysis}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
          >
            <Brain className="h-4 w-4 mr-2" />
            Analyse IA Globale
          </Button>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 animate-pulse">
            <Activity className="h-3 w-3 mr-1" />
            Système Actif
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-white/50 backdrop-blur">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="tickets" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="agents" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="h-4 w-4 mr-2" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="ai-config" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Bot className="h-4 w-4 mr-2" />
            IA Config
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Target className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <SupportDashboard />
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          {/* Filtres */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-500" />
                Filtres et Recherche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <Input
                    placeholder="Rechercher par numéro, sujet ou client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="open">Ouvert</option>
                  <option value="in_progress">En cours</option>
                  <option value="resolved">Résolu</option>
                  <option value="closed">Fermé</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">Toutes priorités</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">Haute</option>
                  <option value="medium">Moyenne</option>
                  <option value="low">Basse</option>
                </select>
                <Button onClick={loadTickets} variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Rechercher
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Liste des tickets */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  Tickets de Support ({filteredTickets.length})
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {filteredTickets.filter(t => t.ai_confidence_score && t.ai_confidence_score > 0.5).length} analysés par IA
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun ticket trouvé
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer bg-white"
                      onClick={() => setSelectedTicket(ticket.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm text-muted-foreground">
                              #{ticket.number}
                            </span>
                            <Badge variant={getPriorityColor(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                            <Badge variant={getStatusColor(ticket.status)}>
                              {ticket.status}
                            </Badge>
                            {ticket.ai_confidence_score && ticket.ai_confidence_score > 0.5 && (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                <Bot className="h-3 w-3 mr-1" />
                                IA: {Math.round(ticket.ai_confidence_score * 100)}%
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-medium">{ticket.subject}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Client: {ticket.companies?.name}</span>
                            <span>Créé: {new Date(ticket.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Agents de Support ({agents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="p-4 border rounded-lg bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {agent.employees?.first_name?.[0]}{agent.employees?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">
                            {agent.employees?.first_name} {agent.employees?.last_name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge variant={getAvailabilityColor(agent.availability_status)}>
                              {agent.availability_status}
                            </Badge>
                            {agent.is_ai_assisted && (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                <Bot className="h-3 w-3 mr-1" />
                                IA
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Tickets actifs:</span>
                        <div className="font-medium">
                          {agent.current_active_tickets}/{agent.max_concurrent_tickets}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total traités:</span>
                        <div className="font-medium">{agent.total_tickets_handled}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Satisfaction:</span>
                        <div className="font-medium">{agent.satisfaction_rating || 0}/5</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Spécialisations:</span>
                        <div className="font-medium text-xs">
                          {agent.specializations?.length > 0 
                            ? agent.specializations.join(', ') 
                            : 'Généraliste'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-config" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-orange-500" />
                Configuration Intelligence Artificielle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Paramètres IA */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    Paramètres d'Analyse
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Seuil de confiance IA</div>
                        <div className="text-sm text-muted-foreground">Minimum pour réponse automatique</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono">75%</div>
                        <Button variant="outline" size="sm">Ajuster</Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Analyse des sentiments</div>
                        <div className="text-sm text-muted-foreground">Détection émotionnelle avancée</div>
                      </div>
                      <div className="text-right">
                        <Badge variant="default">Activé</Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Escalade automatique</div>
                        <div className="text-sm text-muted-foreground">Sur sentiment très négatif</div>
                      </div>
                      <div className="text-right">
                        <Badge variant="default">Activé</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistiques IA */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    Performance IA
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Précision des prédictions</span>
                        <span className="text-2xl font-bold text-blue-600">94%</span>
                      </div>
                    </div>

                    <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Temps de réponse moyen</span>
                        <span className="text-2xl font-bold text-green-600">2.3s</span>
                      </div>
                    </div>

                    <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Tickets traités aujourd'hui</span>
                        <span className="text-2xl font-bold text-purple-600">127</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions IA */}
              <div className="border-t pt-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Actions Rapides
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="h-auto p-4 flex flex-col items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                    <Brain className="h-6 w-6" />
                    <span>Réentraîner Modèle</span>
                  </Button>
                  <Button className="h-auto p-4 flex flex-col items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                    <Target className="h-6 w-6" />
                    <span>Optimiser Règles</span>
                  </Button>
                  <Button className="h-auto p-4 flex flex-col items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                    <Shield className="h-6 w-6" />
                    <span>Test Qualité</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Analyse des Sentiments Globale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">76%</div>
                    <p className="text-muted-foreground">Sentiment positif moyen</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Très positif</span>
                      <span className="font-medium">23%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Positif</span>
                      <span className="font-medium">53%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-400 h-2 rounded-full" style={{ width: '53%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Neutre</span>
                      <span className="font-medium">18%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '18%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Négatif</span>
                      <span className="font-medium">6%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-400 h-2 rounded-full" style={{ width: '6%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Alertes et Escalades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="font-medium text-red-700">Critique</span>
                    </div>
                    <p className="text-sm text-red-600">3 tickets nécessitent une attention immédiate</p>
                  </div>

                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="font-medium text-orange-700">Élevé</span>
                    </div>
                    <p className="text-sm text-orange-600">12 tickets avec sentiment très négatif</p>
                  </div>

                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium text-yellow-700">Moyen</span>
                    </div>
                    <p className="text-sm text-yellow-600">8 tickets nécessitent un suivi</p>
                  </div>

                  <div className="pt-4">
                    <Button className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Voir Toutes les Alertes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}