
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  Bot, 
  Loader2,
  Languages,
  Sparkles,
  X,
  MessageSquare
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
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [isExpanded, setIsExpanded] = useState(false);
  const [contextualSuggestions, setContextualSuggestions] = useState<ContextualSuggestion[]>([]);
  const [lastResponse, setLastResponse] = useState<string>('');
  
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);

  // Générer des suggestions contextuelles basées sur la page actuelle
  const generateContextualSuggestions = React.useCallback(() => {
    const path = location.pathname;
    let suggestions: ContextualSuggestion[] = [];

    switch (true) {
      case path.includes('/dashboard'):
        suggestions = [
          { text: "Analyser les KPIs du mois", action: "dashboard_kpis", icon: "📊" },
          { text: "Résumé des projets urgents", action: "urgent_projects", icon: "🚨" },
          { text: "Performance de l'équipe denne", action: "team_performance", icon: "👥" }
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
          { text: "Employés en congé denne semaine", action: "employees_leave", icon: "🏖️" },
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

  // Initialisation de la reconnaissance vocale
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionConstructor();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'fr' ? 'fr-FR' : 'en-US';
      
      recognitionRef.current.onresult = handleVoiceResult;
      recognitionRef.current.onerror = handleVoiceError;
      recognitionRef.current.onend = () => setIsListening(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  const handleVoiceResult = async (event: SpeechRecognitionEvent) => {
    const transcript = event.results[event.results.length - 1][0].transcript;
    await processVoiceCommand(transcript);
  };

  const handleVoiceError = (event: SpeechRecognitionErrorEvent) => {
    console.error('Erreur reconnaissance vocale:', event.error);
    setIsListening(false);
    
    if (event.error === 'not-allowed') {
      toast({
        variant: "destructive",
        title: "Microphone requis",
        description: "Veuillez autoriser l'accès au microphone"
      });
    }
  };

  const processVoiceCommand = async (transcript: string) => {
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('voice-ai-assistant', {
        body: {
          transcript,
          language,
          currentModule: location.pathname,
          userId,
          context: {
            timestamp: new Date().toISOString(),
            sessionId: `voice_${Date.now()}`,
            suggestions: contextualSuggestions
          }
        }
      });

      if (error) throw error;

      if (data?.response) {
        setLastResponse(data.response);
        await speakResponse(data.response);
        
        // Régénérer les suggestions après une interaction
        setTimeout(generateContextualSuggestions, 1000);
      }
    } catch (error) {
      console.error('Erreur traitement vocal:', error);
      const errorMessage = language === 'fr' 
        ? "Désolé, je n'ai pas pu traiter votre demande."
        : "Sorry, I couldn't process your request.";
      
      setLastResponse(errorMessage);
      await speakResponse(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = async (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'fr' ? 'fr-FR' : 'en-US';
      utterance.rate = 0.9;
      utterance.volume = 0.8;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = async () => {
    if (!recognitionRef.current) {
      toast({
        variant: "destructive",
        title: "Non supporté",
        description: "La reconnaissance vocale n'est pas supportée"
      });
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognitionRef.current.start();
      setIsListening(true);
      setIsExpanded(true);
      
      toast({
        title: "🎤 Synapse activé",
        description: language === 'fr' 
          ? "Dites 'Synapse' suivi de votre question"
          : "Say 'Synapse' followed by your question"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur microphone",
        description: "Impossible d'accéder au microphone"
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleSuggestionClick = async (suggestion: ContextualSuggestion) => {
    await processVoiceCommand(`Synapse ${suggestion.text}`);
  };

  const toggleLanguage = () => {
    const newLang = language === 'fr' ? 'en' : 'fr';
    setLanguage(newLang);
    
    toast({
      title: newLang === 'fr' ? "🇫🇷 Français" : "🇺🇸 English",
      description: newLang === 'fr' 
        ? "Assistant en français"
        : "Assistant in English"
    });
  };

  return (
    <>
      {/* Bouton flottant principal */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          size="icon"
        >
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          ) : isListening ? (
            <div className="flex items-center justify-center">
              <Mic className="h-6 w-6 text-white" />
              <div className="absolute w-6 h-6 bg-red-500 rounded-full animate-pulse opacity-50" />
            </div>
          ) : (
            <Bot className="h-6 w-6 text-white" />
          )}
        </Button>
      </div>

      {/* Interface contextuelle expandée */}
      {isExpanded && (
        <Card className="fixed bottom-24 right-6 w-80 z-40 shadow-2xl border-primary/20 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Synapse AI</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLanguage}
                  className="h-8 w-8 p-0"
                >
                  <Languages className="h-4 w-4" />
                </Button>
                <Badge variant={language === 'fr' ? 'default' : 'secondary'}>
                  {language === 'fr' ? '🇫🇷' : '🇺🇸'}
                </Badge>
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
            {/* Status */}
            <div className="text-center">
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Traitement IA...</span>
                </div>
              ) : isListening ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm">À l'écoute...</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {language === 'fr' ? 'Assistant contextuel prêt' : 'Contextual assistant ready'}
                </span>
              )}
            </div>

            {/* Contrôles vocaux */}
            <div className="flex gap-2">
              {!isListening ? (
                <Button onClick={startListening} className="flex-1" disabled={isProcessing}>
                  <Mic className="h-4 w-4 mr-2" />
                  {language === 'fr' ? 'Parler' : 'Speak'}
                </Button>
              ) : (
                <Button onClick={stopListening} variant="destructive" className="flex-1">
                  <MicOff className="h-4 w-4 mr-2" />
                  {language === 'fr' ? 'Arrêter' : 'Stop'}
                </Button>
              )}
            </div>

            {/* Suggestions contextuelles */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {language === 'fr' ? 'Suggestions contextuelles' : 'Contextual suggestions'}
              </h4>
              <div className="space-y-2">
                {contextualSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full justify-start text-left h-auto py-2 px-3"
                    disabled={isProcessing || isListening}
                  >
                    <span className="mr-2">{suggestion.icon}</span>
                    <span className="text-xs">{suggestion.text}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Dernière réponse */}
            {lastResponse && (
              <div className="bg-muted/50 rounded p-2">
                <p className="text-xs text-muted-foreground mb-1">
                  {language === 'fr' ? 'Dernière réponse :' : 'Last response:'}
                </p>
                <p className="text-sm">{lastResponse}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="text-center text-xs text-muted-foreground">
              {language === 'fr' ? (
                <>Dites <strong>"Synapse"</strong> puis votre question</>
              ) : (
                <>Say <strong>"Synapse"</strong> then your question</>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
