
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';
import { GeminiLiveInterface } from './GeminiLiveInterface';
import { 
  Mic, 
  MicOff, 
  Bot, 
  Loader2,
  Languages,
  Sparkles,
  X,
  MessageSquare,
  Zap
} from 'lucide-react';

interface ContextualSuggestion {
  text: string;
  action: string;
  icon: string;
}

interface GlobalVoiceAssistantProps {
  userId?: string;
}

export const GlobalVoiceAssistant: React.FC<GlobalVoiceAssistantProps> = ({
  userId
}) => {
  const { toast } = useToast();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [useGeminiLive, setUseGeminiLive] = useState(true);
  const [contextualSuggestions, setContextualSuggestions] = useState<ContextualSuggestion[]>([]);
  
  // Générer des suggestions contextuelles basées sur la page actuelle
  const generateContextualSuggestions = React.useCallback(() => {
    const path = location.pathname;
    let suggestions: ContextualSuggestion[] = [];

    switch (true) {
      case path.includes('/dashboard'):
        suggestions = [
          { text: "Analyser les KPIs du mois", action: "dashboard_kpis", icon: "📊" },
          { text: "Résumé des projets urgents", action: "urgent_projects", icon: "🚨" },
          { text: "Performance de l'équipe cette semaine", action: "team_performance", icon: "👥" }
        ];
        break;
      case path.includes('/projects'):
        suggestions = [
          { text: "Projets en retard", action: "delayed_projects", icon: "⏰" },
          { text: "Ressources disponibles", action: "available_resources", icon: "👨‍💼" },
          { text: "Prochaines échéances", action: "upcoming_deadlines", icon: "📅" }
        ];
        break;
      case path.includes('/hr'):
        suggestions = [
          { text: "Employés en congé cette semaine", action: "employees_leave", icon: "🏖️" },
          { text: "Nouveaux recrutements", action: "new_hires", icon: "🆕" },
          { text: "Évaluations en attente", action: "pending_reviews", icon: "📝" }
        ];
        break;
      case path.includes('/business'):
        suggestions = [
          { text: "Devis en attente de validation", action: "pending_quotes", icon: "💰" },
          { text: "Factures impayées", action: "unpaid_invoices", icon: "💳" },
          { text: "Nouveaux clients ce mois", action: "new_clients", icon: "🤝" }
        ];
        break;
      default:
        suggestions = [
          { text: "Vue d'ensemble de l'entreprise", action: "company_overview", icon: "🏢" },
          { text: "Alertes importantes", action: "important_alerts", icon: "🔔" },
          { text: "Recommandations du jour", action: "daily_recommendations", icon: "✨" }
        ];
    }

    setContextualSuggestions(suggestions);
  }, [location.pathname]);

  useEffect(() => {
    generateContextualSuggestions();
  }, [generateContextualSuggestions]);

  return (
    <>
      {/* Bouton flottant principal */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          size="icon"
        >
          <Bot className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Interface contextuelle expandée */}
      {isExpanded && (
        <Card className="fixed bottom-24 right-6 w-96 z-40 shadow-2xl border-primary/20 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Synapse AI</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={useGeminiLive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseGeminiLive(!useGeminiLive)}
                >
                  <Zap className="h-4 w-4 mr-1" />
                  {useGeminiLive ? 'Live' : 'Classic'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {useGeminiLive ? (
              <GeminiLiveInterface />
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                Mode classique (à implémenter si nécessaire)
              </div>
            )}

            {/* Suggestions contextuelles */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                Suggestions contextuelles
              </h4>
              <div className="space-y-2">
                {contextualSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3"
                  >
                    <span className="mr-2">{suggestion.icon}</span>
                    <span className="text-xs">{suggestion.text}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="text-center text-xs text-muted-foreground">
              {useGeminiLive ? 
                "Conversation vocale naturelle avec Gemini Live" :
                "Assistant vocal classique"
              }
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
