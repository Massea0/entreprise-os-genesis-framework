
import React from 'react';
import { VoiceInterface } from '@/components/ai/VoiceInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Brain, Mic, Database, Languages, Zap } from 'lucide-react';

export default function SynapsePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full">
              <Brain className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🧠 Synapse Live
              </h1>
              <p className="text-xl text-muted-foreground">
                Votre Assistant IA Vocal Intelligent
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Languages className="h-3 w-3" />
              Français & English
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              Accès Base de Données
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Temps Réel
            </Badge>
          </div>
        </div>

        {/* Capabilities Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-primary/20 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-blue-100 rounded-full w-fit">
                <Mic className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Navigation Vocale</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Naviguez dans l'application, consultez des données et exécutez des actions par commande vocale en français ou anglais.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-purple-100 rounded-full w-fit">
                <Database className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Analyse de Données</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Synapse analyse vos projets, équipes, finances et génère des insights intelligents basés sur toutes vos données.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-green-100 rounded-full w-fit">
                <Bot className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Assistant Intelligent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Posez des questions complexes, demandez des rapports ou obtenez des recommandations stratégiques pour votre entreprise.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Examples */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Exemples de commandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">🇫🇷 En Français :</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• "Synapse, montre-moi les projets en cours"</li>
                  <li>• "Quels sont les employés disponibles cette semaine ?"</li>
                  <li>• "Analyse les performances de l'équipe développement"</li>
                  <li>• "Crée un rapport sur les factures impayées"</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">🇺🇸 In English :</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• "Synapse, show me project deadlines"</li>
                  <li>• "What's the team productivity this month?"</li>
                  <li>• "Generate insights on client satisfaction"</li>
                  <li>• "Help me optimize resource allocation"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold mb-2">Comment utiliser Synapse ?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Cliquez sur le bouton d'activation en bas à droite, puis dites <strong>"Synapse"</strong> suivi de votre question ou commande.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>🎤 Microphone requis</span>
              <span>•</span>
              <span>🔊 Haut-parleurs recommandés</span>
              <span>•</span>
              <span>🌐 Connexion internet nécessaire</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Voice Interface (floating) */}
      <VoiceInterface 
        currentModule="synapse"
        onInsight={(insight) => {
          console.log('Synapse Insight:', insight);
        }}
      />
    </div>
  );
}
