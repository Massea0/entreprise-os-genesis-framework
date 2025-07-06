import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Brain,
  Sparkles,
  TrendingUp,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  Eye,
  MessageSquare,
  Activity,
  Star,
  Lightbulb,
  Rocket,
  Shield
} from 'lucide-react';

interface SynapseInsight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'critical';
  category: string;
  title: string;
  description: string;
  action?: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  priority: number;
}

interface SynapseInsightsProps {
  context?: string;
  entityId?: string;
  entityType?: string;
  compact?: boolean;
  maxInsights?: number;
}

export const SynapseInsights: React.FC<SynapseInsightsProps> = ({
  context = 'global',
  entityId,
  entityType,
  compact = false,
  maxInsights = 3
}) => {
  const [insights, setInsights] = useState<SynapseInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    generateInsights();
  }, [context, entityId, entityType]);

  const generateInsights = async () => {
    setLoading(true);
    try {
      // Simuler l'analyse IA basée sur le contexte
      const contextInsights = await generateContextualInsights(context, entityId, entityType);
      setInsights(contextInsights.slice(0, maxInsights));
    } catch (error) {
      console.error('Erreur génération insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateContextualInsights = async (context: string, entityId?: string, entityType?: string): Promise<SynapseInsight[]> => {
    // Simuler l'analyse IA contextuelle
    const baseInsights: SynapseInsight[] = [];

    switch (context) {
      case 'dashboard':
        baseInsights.push(
          {
            id: '1',
            type: 'success',
            category: 'Performance',
            title: '📊 Productivité en hausse',
            description: 'Vos équipes affichent une amélioration de 23% cette semaine',
            confidence: 0.94,
            impact: 'high',
            priority: 1,
            action: 'Voir détails performance'
          },
          {
            id: '2',
            type: 'warning',
            category: 'Planification',
            title: '⚠️ Goulot d\'étranglement détecté',
            description: '3 projets risquent un retard si les ressources ne sont pas réallouées',
            confidence: 0.87,
            impact: 'medium',
            priority: 2,
            action: 'Optimiser ressources'
          },
          {
            id: '3',
            type: 'info',
            category: 'Innovation',
            title: '💡 Opportunité d\'automatisation',
            description: 'IA peut réduire 40% du temps des tâches répétitives identifiées',
            confidence: 0.91,
            impact: 'high',
            priority: 1,
            action: 'Explorer automatisation'
          }
        );
        break;

      case 'projects':
        baseInsights.push(
          {
            id: '1',
            type: 'critical',
            category: 'Risque',
            title: '🚨 Projet à risque critique',
            description: 'Le projet Alpha montre 3 indicateurs de risque majeurs',
            confidence: 0.96,
            impact: 'high',
            priority: 1,
            action: 'Intervention immédiate'
          },
          {
            id: '2',
            type: 'success',
            category: 'Optimisation',
            title: '🎯 Réallocation optimale suggérée',
            description: 'Transfert de 2 développeurs vers Beta augmenterait l\'efficacité de 35%',
            confidence: 0.89,
            impact: 'medium',
            priority: 2,
            action: 'Appliquer suggestion'
          }
        );
        break;

      case 'hr':
        baseInsights.push(
          {
            id: '1',
            type: 'info',
            category: 'Talent',
            title: '⭐ Talents émergents identifiés',
            description: '4 employés montrent un potentiel de leadership élevé',
            confidence: 0.92,
            impact: 'high',
            priority: 1,
            action: 'Planifier développement'
          },
          {
            id: '2',
            type: 'warning',
            category: 'Rétention',
            title: '📉 Risque de départ élevé',
            description: '2 employés clés présentent des signaux de désengagement',
            confidence: 0.85,
            impact: 'high',
            priority: 1,
            action: 'Entretien de rétention'
          }
        );
        break;

      case 'support':
        baseInsights.push(
          {
            id: '1',
            type: 'success',
            category: 'Performance',
            title: '🚀 Résolution ultra-rapide',
            description: 'Temps de résolution amélioré de 45% grâce à l\'IA',
            confidence: 0.97,
            impact: 'high',
            priority: 1
          },
          {
            id: '2',
            type: 'info',
            category: 'Prédiction',
            title: '🔮 Pic de demandes prévu',
            description: 'Augmentation de 60% des tickets prévue cette semaine',
            confidence: 0.88,
            impact: 'medium',
            priority: 2,
            action: 'Pré-positionner agents'
          }
        );
        break;

      default:
        baseInsights.push(
          {
            id: '1',
            type: 'info',
            category: 'IA',
            title: '🧠 Synapse activé',
            description: 'Intelligence artificielle prête à vous assister',
            confidence: 1.0,
            impact: 'medium',
            priority: 3
          }
        );
    }

    return baseInsights;
  };

  const runDeepAnalysis = async () => {
    setIsAnalyzing(true);
    toast({
      title: "🧠 Analyse approfondie en cours",
      description: "Synapse analyse votre environnement..."
    });

    // Simuler analyse approfondie
    setTimeout(() => {
      setIsAnalyzing(false);
      toast({
        title: "✨ Analyse terminée",
        description: "Nouveaux insights disponibles"
      });
      generateInsights();
    }, 3000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <Shield className="h-4 w-4 text-red-500" />;
      default: return <Lightbulb className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getImpactBadge = (impact: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-orange-100 text-orange-600',
      high: 'bg-red-100 text-red-600'
    };
    return colors[impact as keyof typeof colors] || colors.low;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <div className="flex items-center gap-1">
          <Brain className="h-4 w-4 text-purple-600 animate-pulse" />
          <span className="text-xs font-medium text-purple-700">Synapse</span>
        </div>
        {insights.length > 0 && (
          <Badge variant="outline" className="text-xs bg-white">
            {insights.length} insight{insights.length > 1 ? 's' : ''}
          </Badge>
        )}
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-6 px-2 text-xs"
          onClick={runDeepAnalysis}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? <Activity className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            🧠 Synapse Insights
            <Badge variant="outline" className="bg-white/80 text-purple-700 border-purple-200">
              IA Contextuelle
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              onClick={runDeepAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Activity className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {isAnalyzing ? 'Analyse...' : 'Analyse profonde'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-white/50 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto text-purple-400 mb-3" />
            <p className="text-muted-foreground">Aucun insight disponible pour le moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${getTypeColor(insight.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getTypeIcon(insight.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{insight.title}</h4>
                        <Badge className={`text-xs ${getImpactBadge(insight.impact)}`}>
                          {insight.impact}
                        </Badge>
                      </div>
                      <p className="text-sm opacity-90 mb-2">
                        {insight.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span>Confiance: {Math.round(insight.confidence * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          <span>{insight.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {insight.action && (
                  <div className="mt-3 pt-3 border-t border-white/30">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-xs h-7 px-3 bg-white/20 hover:bg-white/30"
                    >
                      <Rocket className="h-3 w-3 mr-1" />
                      {insight.action}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-white/30">
          <div className="flex items-center justify-between text-xs text-purple-700">
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3" />
              <span>Système IA actif</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>Contexte: {context}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};