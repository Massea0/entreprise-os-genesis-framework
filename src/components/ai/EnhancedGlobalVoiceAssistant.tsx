import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { GeminiLiveInterface } from './GeminiLiveInterface';
import { SynapseInsights } from './SynapseInsights';
import { useAIContext } from './AIContextProvider';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bot, 
  X,
  MessageSquare,
  Zap,
  Sparkles,
  TrendingUp,
  Users,
  Briefcase,
  Target,
  Brain,
  Activity,
  Settings2
} from 'lucide-react';

interface EnhancedGlobalVoiceAssistantProps {
  userId?: string;
}

export const EnhancedGlobalVoiceAssistant: React.FC<EnhancedGlobalVoiceAssistantProps> = ({
  userId
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeMode, setActiveMode] = useState<'gemini' | 'synapse' | 'both'>('both');
  
  const { 
    contextualSuggestions, 
    currentModule, 
    projects, 
    employees, 
    companies, 
    tasks,
    devis,
    invoices,
    isLoading 
  } = useAIContext();

  const userRole = user?.user_metadata?.role || 'client';

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'hr': return <Users className="h-4 w-4" />;
      case 'projects': return <Briefcase className="h-4 w-4" />;
      case 'business': return <Target className="h-4 w-4" />;
      case 'dashboard': 
      case 'admin-dashboard':
      case 'client-dashboard': return <TrendingUp className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getContextStats = () => {
    return {
      projectsCount: projects.length,
      employeesCount: employees.length,
      companiesCount: companies.length,
      tasksCount: tasks.length,
      devisCount: devis.length,
      invoicesCount: invoices.length,
      inProgressProjects: projects.filter(p => p.status === 'in_progress').length,
      pendingTasks: tasks.filter(t => t.status === 'todo').length,
      pendingDevis: devis.filter(d => d.status === 'sent' || d.status === 'pending').length,
      paidInvoices: invoices.filter(i => i.status === 'paid').length
    };
  };

  const handleSuggestionClick = async (suggestion: any) => {
    try {
      toast({
        title: `🤖 Synapse analyse: ${suggestion.text}`,
        description: `Module: ${suggestion.module} | Action: ${suggestion.action}`
      });
    } catch (error) {
      console.error('Erreur suggestion:', error);
    }
  };

  const stats = getContextStats();
  const hasData = stats.projectsCount > 0 || stats.tasksCount > 0;

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
            <Brain className="h-6 w-6 text-white" />
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

          {/* Indicateur de données */}
          {hasData && (
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
          )}
        </div>
      </div>

      {/* Interface contextuelle expandée */}
      {isExpanded && (
        <Card className="fixed bottom-24 right-6 w-96 z-40 shadow-2xl border-primary/20 bg-white/95 backdrop-blur-sm max-h-[80vh] overflow-y-auto">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Synapse IA Avancé</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {getModuleIcon(currentModule)}
                  <span className="ml-1 capitalize">{currentModule}</span>
                </Badge>
              </div>
              <div className="flex items-center gap-2">
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

            {/* Mode selector */}
            <div className="flex items-center gap-1 mt-2">
              <Button
                variant={activeMode === 'gemini' ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveMode('gemini')}
                className="text-xs"
              >
                <Zap className="h-3 w-3 mr-1" />
                Gemini Live
              </Button>
              <Button
                variant={activeMode === 'synapse' ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveMode('synapse')}
                className="text-xs"
              >
                <Brain className="h-3 w-3 mr-1" />
                Synapse
              </Button>
              <Button
                variant={activeMode === 'both' ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveMode('both')}
                className="text-xs"
              >
                <Settings2 className="h-3 w-3 mr-1" />
                Hybride
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Statistiques contextuelles avec données réelles */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-50 p-2 rounded flex items-center gap-1">
                <Briefcase className="h-3 w-3 text-blue-600" />
                <span>{stats.projectsCount} projets ({stats.inProgressProjects} actifs)</span>
              </div>
              {userRole !== 'client' && (
                <div className="bg-green-50 p-2 rounded flex items-center gap-1">
                  <Users className="h-3 w-3 text-green-600" />
                  <span>{stats.employeesCount} employés</span>
                </div>
              )}
              <div className="bg-orange-50 p-2 rounded flex items-center gap-1">
                <Target className="h-3 w-3 text-orange-600" />
                <span>{stats.companiesCount} client{stats.companiesCount > 1 ? 's' : ''}</span>
              </div>
              <div className="bg-purple-50 p-2 rounded flex items-center gap-1">
                <MessageSquare className="h-3 w-3 text-purple-600" />
                <span>{stats.tasksCount} tâches ({stats.pendingTasks} en attente)</span>
              </div>
              {(userRole === 'admin' || userRole === 'super_admin' || userRole === 'client') && (
                <>
                  <div className="bg-yellow-50 p-2 rounded flex items-center gap-1">
                    <Activity className="h-3 w-3 text-yellow-600" />
                    <span>{stats.devisCount} devis ({stats.pendingDevis} en cours)</span>
                  </div>
                  <div className="bg-green-50 p-2 rounded flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span>{stats.invoicesCount} factures ({stats.paidInvoices} payées)</span>
                  </div>
                </>
              )}
            </div>

            {/* Interface Gemini Live */}
            {(activeMode === 'gemini' || activeMode === 'both') && (
              <div className="border rounded-lg p-3 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Gemini Live</span>
                </div>
                <GeminiLiveInterface />
              </div>
            )}

            {/* Synapse Insights */}
            {(activeMode === 'synapse' || activeMode === 'both') && (
              <div className="border rounded-lg p-3 bg-gradient-to-r from-purple-50 to-indigo-50">
                <SynapseInsights 
                  context={currentModule}
                  compact={activeMode === 'both'}
                  maxInsights={activeMode === 'both' ? 2 : 3}
                />
              </div>
            )}

            {/* Suggestions contextuelles avec données réelles */}
            {contextualSuggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Actions suggérées ({contextualSuggestions.length})
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
                      <span className="text-xs flex-1">{suggestion.text}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions contextuelles */}
            <div className="text-center text-xs text-muted-foreground border-t pt-2">
              {activeMode === 'gemini' && "💬 Conversation vocale avec contexte temps réel"}
              {activeMode === 'synapse' && "🧠 Insights intelligents basés sur vos données"}
              {activeMode === 'both' && "🚀 IA hybride: voix + insights personnalisés"}
              <div className="mt-1 text-green-600">
                ✅ {hasData ? 'Données chargées' : 'Aucune donnée'} • Rôle: {userRole}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};