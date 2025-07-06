import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bot, 
  MessageSquare, 
  Send, 
  Brain, 
  AlertTriangle,
  Clock,
  User,
  Zap,
  Sparkles,
  TrendingUp,
  Heart,
  Frown,
  Meh,
  Smile,
  ChevronRight,
  Activity,
  Target
} from 'lucide-react';

interface Ticket {
  id: string;
  number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  ai_confidence_score?: number;
  sentiment_trend?: any;
  resolution_suggestions?: any;
}

interface Message {
  id: string;
  content: string;
  author_name: string;
  author_role: string;
  created_at: string;
}

interface SentimentAnalysis {
  sentiment_score: number;
  sentiment_label: string;
  emotions: any;
  urgency_level: number;
  confidence_score: number;
}

interface TicketViewProps {
  ticketId: string;
  onClose: () => void;
}

export default function TicketView({ ticketId, onClose }: TicketViewProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sentiment, setSentiment] = useState<SentimentAnalysis | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTicketData();
    loadMessages();
    loadLatestSentiment();
  }, [ticketId]);

  const loadTicketData = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          companies (name),
          ticket_categories (name)
        `)
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      setTicket(data);
    } catch (error) {
      console.error('Erreur lors du chargement du ticket:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger le ticket"
      });
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLatestSentiment = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_sentiment_analysis')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setSentiment(data);
    } catch (error) {
      console.error('Erreur lors du chargement du sentiment:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          content: newMessage,
          author_id: 'system',
          author_name: 'Agent Support',
          author_role: 'agent'
        });

      if (error) throw error;

      setNewMessage('');
      await loadMessages();
      
      toast({
        title: "Message envoyé",
        description: "Votre réponse a été envoyée au client"
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer le message"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const generateAIResponse = async () => {
    if (generatingResponse) return;

    setGeneratingResponse(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-support-assistant', {
        body: {
          action: 'generate_response',
          ticketId,
          messageContent: messages[messages.length - 1]?.content || ticket?.description
        }
      });

      if (error) throw error;

      if (data?.success && data?.response) {
        setAiSuggestion(data.response);
        toast({
          title: "🤖 Réponse IA générée",
          description: "Synapse a analysé le contexte et suggère une réponse"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la génération IA:', error);
      toast({
        variant: "destructive",
        title: "Erreur IA",
        description: "Impossible de générer une réponse automatique"
      });
    } finally {
      setGeneratingResponse(false);
    }
  };

  const useAISuggestion = () => {
    setNewMessage(aiSuggestion);
    setAiSuggestion('');
  };

  const analyzeTicket = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-support-assistant', {
        body: {
          action: 'analyze_ticket',
          ticketId,
          ticketData: ticket
        }
      });

      if (error) throw error;

      if (data?.success) {
        await loadTicketData();
        await loadLatestSentiment();
        toast({
          title: "🧠 Analyse IA terminée",
          description: "Le ticket a été analysé et catégorisé automatiquement"
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse IA:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'analyser le ticket"
      });
    }
  };

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

  const getSentimentIcon = (score: number) => {
    if (score >= 0.3) return <Smile className="h-4 w-4 text-green-500" />;
    if (score >= -0.3) return <Meh className="h-4 w-4 text-yellow-500" />;
    return <Frown className="h-4 w-4 text-red-500" />;
  };

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive': return 'text-green-600';
      case 'neutral': return 'text-yellow-600';
      case 'negative': return 'text-red-600';
      case 'very_negative': return 'text-red-700';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Ticket non trouvé</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50/20">
      {/* Header */}
      <div className="bg-white border-b shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">#{ticket.number}</h1>
              <Badge variant={getPriorityColor(ticket.priority)}>
                {ticket.priority}
              </Badge>
              <Badge variant={getStatusColor(ticket.status)}>
                {ticket.status}
              </Badge>
              {ticket.ai_confidence_score && ticket.ai_confidence_score > 0.5 && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Bot className="h-3 w-3 mr-1" />
                  IA Analysé
                </Badge>
              )}
            </div>
            <h2 className="text-lg text-muted-foreground">{ticket.subject}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={analyzeTicket}>
              <Brain className="h-4 w-4 mr-2" />
              Analyser avec IA
            </Button>
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Conversation principale */}
        <div className="flex-1 flex flex-col space-y-4">
          {/* Messages */}
          <Card className="flex-1 flex flex-col border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                Conversation
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              <div className="flex-1 overflow-y-auto space-y-4 max-h-[400px]">
                {/* Description initiale */}
                <div className="p-4 bg-slate-50 rounded-lg border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">Client - Ticket initial</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{ticket.description}</p>
                </div>

                {/* Messages */}
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${
                      message.author_role === 'client' 
                        ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                        : 'bg-green-50 border-l-4 border-l-green-500 ml-8'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {message.author_role === 'client' ? 'C' : 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{message.author_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {message.author_role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{message.content}</p>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Suggestion IA */}
              {aiSuggestion && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="font-medium text-purple-700">Suggestion Synapse IA</span>
                    <Button size="sm" variant="outline" onClick={useAISuggestion}>
                      Utiliser
                    </Button>
                  </div>
                  <p className="text-gray-700 text-sm">{aiSuggestion}</p>
                </div>
              )}

              {/* Zone de réponse */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={generateAIResponse}
                    disabled={generatingResponse}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 hover:from-purple-600 hover:to-indigo-600"
                  >
                    {generatingResponse ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                    ) : (
                      <Bot className="h-3 w-3 mr-2" />
                    )}
                    Générer réponse IA
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Tapez votre réponse..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 min-h-[100px] resize-none"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || sendingMessage}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    {sendingMessage ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panneau d'analyse IA */}
        <div className="w-80 space-y-4">
          {/* Analyse des sentiments */}
          {sentiment && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Heart className="h-4 w-4 text-red-500" />
                  Analyse des Sentiments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    {getSentimentIcon(sentiment.sentiment_score)}
                    <span className={`font-medium ${getSentimentColor(sentiment.sentiment_label)}`}>
                      {sentiment.sentiment_label}
                    </span>
                  </div>
                  <div className="text-2xl font-bold">
                    {Math.round((sentiment.sentiment_score + 1) * 50)}%
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Émotions détectées:</h4>
                  {Object.entries(sentiment.emotions || {}).map(([emotion, score]) => (
                    <div key={emotion} className="flex justify-between text-xs">
                      <span className="capitalize">{emotion}</span>
                      <span className="font-medium">{Math.round((score as number) * 100)}%</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                  <span>Niveau d'urgence: {sentiment.urgency_level}/5</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggestions IA */}
          {ticket.resolution_suggestions && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-indigo-500" />
                  Suggestions IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="h-3 w-3 text-blue-500" />
                    <span>Temps estimé: {ticket.resolution_suggestions.estimated_resolution_time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Activity className="h-3 w-3 text-green-500" />
                    <span>Confiance: {Math.round((ticket.ai_confidence_score || 0) * 100)}%</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Actions recommandées:</h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {ticket.resolution_suggestions.requires_human ? (
                      <div className="flex items-center gap-2 text-orange-600">
                        <User className="h-3 w-3" />
                        <span>Intervention humaine requise</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600">
                        <Bot className="h-3 w-3" />
                        <span>Résolution automatique possible</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions rapides */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-yellow-500" />
                Actions Rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <ChevronRight className="h-3 w-3 mr-2" />
                Escalader
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <ChevronRight className="h-3 w-3 mr-2" />
                Marquer résolu
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <ChevronRight className="h-3 w-3 mr-2" />
                Assigner
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}