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
  const [activeTab, setActiveTab] = useState<'voice' | 'insights'>('voice');
  
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
        <Card className="fixed bottom-24 right-6 w-96 z-50 shadow-2xl border-primary/20 bg-white/95 backdrop-blur-sm max-h-[80vh] overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary animate-pulse" />
                <CardTitle className="text-lg font-bold">Synapse IA</CardTitle>
                <Badge variant="outline" className="text-xs bg-primary/10">
                  {getModuleIcon(currentModule)}
                  <span className="ml-1 capitalize">{currentModule}</span>
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-8 w-8 p-0 hover:bg-red-100 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Onglets améliorés */}
            <div className="flex w-full bg-muted/50 rounded-xl p-1 border">
              <Button
                variant={activeTab === 'voice' ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab('voice')}
                className={`flex-1 text-xs h-9 rounded-lg transition-all ${
                  activeTab === 'voice' 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'hover:bg-muted'
                }`}
              >
                <Zap className="h-4 w-4 mr-2" />
                Voice Live
              </Button>
              <Button
                variant={activeTab === 'insights' ? "default" : "ghost"}
                size="sm" 
                onClick={() => setActiveTab('insights')}
                className={`flex-1 text-xs h-9 rounded-lg transition-all ${
                  activeTab === 'insights' 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'hover:bg-muted'
                }`}
              >
                <Brain className="h-4 w-4 mr-2" />
                Insights
              </Button>
            </div>
          </CardHeader>

          <CardContent className="h-[520px] overflow-y-auto p-4">
            {activeTab === 'voice' && (
              <div className="space-y-4">
                {/* Statistiques contextuelles */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg flex items-center gap-2 border border-blue-200">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-semibold text-blue-900">{stats.projectsCount}</div>
                      <div className="text-blue-700">projets</div>
                    </div>
                  </div>
                  {userRole !== 'client' && (
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg flex items-center gap-2 border border-green-200">
                      <Users className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="font-semibold text-green-900">{stats.employeesCount}</div>
                        <div className="text-green-700">employés</div>
                      </div>
                    </div>
                  )}
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-3 rounded-lg flex items-center gap-2 border border-orange-200">
                    <Target className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="font-semibold text-orange-900">{stats.companiesCount}</div>
                      <div className="text-orange-700">clients</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-lg flex items-center gap-2 border border-purple-200">
                    <MessageSquare className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="font-semibold text-purple-900">{stats.tasksCount}</div>
                      <div className="text-purple-700">tâches</div>
                    </div>
                  </div>
                </div>

                {/* Interface Synapse Live améliorée */}
                <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 rounded-xl p-4 border border-blue-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Synapse Voice Live</h3>
                      <p className="text-xs text-gray-600">Assistant vocal intelligent avec accès données</p>
                    </div>
                  </div>
                  <GeminiLiveInterface />
                </div>

                {/* Instructions améliorées */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">État du système</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Contexte:</span>
                      <span className="font-medium capitalize">{currentModule}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Données:</span>
                      <span className={`font-medium ${hasData ? 'text-green-600' : 'text-orange-600'}`}>
                        {hasData ? '✅ Chargées' : '⏳ En attente'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Voice AI:</span>
                      <span className="font-medium text-blue-600">🎤 Disponible</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-4">
                {/* Synapse Insights */}
                <SynapseInsights 
                  context={currentModule}
                  compact={false}
                  maxInsights={4}
                />

                {/* Suggestions contextuelles */}
                {contextualSuggestions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Actions suggérées ({contextualSuggestions.length})
                    </h4>
                    <div className="space-y-2">
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
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};