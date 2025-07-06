
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { SynapseVoiceInterface } from './SynapseVoiceInterface';
import { useAIContext } from './AIContextProvider';
import { 
  Bot, 
  X,
  MessageSquare,
  Zap,
  Sparkles,
  TrendingUp,
  Users,
  Briefcase,
  Target
} from 'lucide-react';

interface GlobalVoiceAssistantProps {
  userId?: string;
}

export const GlobalVoiceAssistant: React.FC<GlobalVoiceAssistantProps> = ({
  userId
}) => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [useGeminiLive, setUseGeminiLive] = useState(true);
  
  const { 
    contextualSuggestions, 
    currentModule, 
    projects, 
    employees, 
    companies, 
    tasks,
    isLoading 
  } = useAIContext();

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'hr': return <Users className="h-4 w-4" />;
      case 'projects': return <Briefcase className="h-4 w-4" />;
      case 'business': return <Target className="h-4 w-4" />;
      case 'dashboard': return <TrendingUp className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getContextStats = () => {
    return {
      projectsCount: projects.length,
      employeesCount: employees.length,
      companiesCount: companies.length,
      tasksCount: tasks.length,
      inProgressProjects: projects.filter(p => p.status === 'in_progress').length,
      pendingTasks: tasks.filter(t => t.status === 'todo').length
    };
  };

  const handleSuggestionClick = async (suggestion: any) => {
    try {
      // Ici, nous pourrions déclencher une action spécifique
      // Pour l'instant, nous affichons juste un toast informatif
      toast({
        title: `🤖 Synapse analysera: ${suggestion.text}`,
        description: `Module: ${suggestion.module} | Action: ${suggestion.action}`
      });
    } catch (error) {
      console.error('Erreur suggestion:', error);
    }
  };

  const stats = getContextStats();

  return (
    <>
      {/* Bouton flottant principal avec indicateur de contexte */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
            size="icon"
          >
            <Bot className="h-6 w-6 text-white" />
          </Button>
          
          {/* Indicateur de contexte actif */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            {getModuleIcon(currentModule)}
          </div>
          
          {/* Badge de suggestions disponibles */}
          {contextualSuggestions.length > 0 && (
            <Badge 
              variant="secondary" 
              className="absolute -top-2 -left-2 bg-orange-500 text-white text-xs px-1 py-0"
            >
              {contextualSuggestions.length}
            </Badge>
          )}
        </div>
      </div>

      {/* Interface contextuelle expandée */}
      {isExpanded && (
        <Card className="fixed bottom-24 right-6 w-96 z-40 shadow-2xl border-primary/20 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Synapse AI</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {getModuleIcon(currentModule)}
                  <span className="ml-1 capitalize">{currentModule}</span>
                </Badge>
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
            {/* Statistiques contextuelles rapides */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-50 p-2 rounded flex items-center gap-1">
                <Briefcase className="h-3 w-3 text-blue-600" />
                <span>{stats.projectsCount} projets ({stats.inProgressProjects} actifs)</span>
              </div>
              <div className="bg-green-50 p-2 rounded flex items-center gap-1">
                <Users className="h-3 w-3 text-green-600" />
                <span>{stats.employeesCount} employés</span>
              </div>
              <div className="bg-orange-50 p-2 rounded flex items-center gap-1">
                <Target className="h-3 w-3 text-orange-600" />
                <span>{stats.companiesCount} clients</span>
              </div>
              <div className="bg-purple-50 p-2 rounded flex items-center gap-1">
                <MessageSquare className="h-3 w-3 text-purple-600" />
                <span>{stats.tasksCount} tâches ({stats.pendingTasks} en attente)</span>
              </div>
            </div>

            {/* Interface Gemini Live */}
            {useGeminiLive ? (
              <SynapseVoiceInterface />
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                Mode classique (à implémenter si nécessaire)
              </div>
            )}

            {/* Suggestions contextuelles */}
            {contextualSuggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Suggestions {currentModule}
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {contextualSuggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left h-auto py-2 px-3 hover:bg-primary/5"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="mr-2">{suggestion.icon}</span>
                      <span className="text-xs">{suggestion.text}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="text-center text-xs text-muted-foreground border-t pt-2">
              {useGeminiLive ? 
                "💬 Conversation vocale naturelle • Contexte temps réel activé" :
                "Assistant vocal classique"
              }
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
