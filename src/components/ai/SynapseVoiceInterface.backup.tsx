import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAIContext } from '@/components/ai/AIContextProvider';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Bot,
  Loader2,
  Zap,
  Brain,
  AlertCircle,
  Play,
  Square
} from 'lucide-react';

// Version simplifiée pour le déploiement Lovable
export const SynapseVoiceInterface: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { refreshContext } = useAIContext();
  
  // État local simplifié
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);

  // Gestionnaires simplifiés pour éviter les erreurs de build
  const handleConnect = async () => {
    setStatus('connecting');
    toast({
      title: "Connexion",
      description: "Connexion à Synapse IA...",
      duration: 2000,
    });
    
    // Simulation de connexion
    setTimeout(() => {
      setStatus('connected');
      toast({
        title: "Connecté",
        description: "Synapse IA est en ligne",
        duration: 3000,
      });
    }, 2000);
  };

  const handleDisconnect = async () => {
    setStatus('disconnected');
    setIsListening(false);
    toast({
      title: "Déconnecté",
      description: "Synapse IA est hors ligne",
      variant: "destructive",
      duration: 3000,
    });
  };

  const handleStartListening = async () => {
    if (status !== 'connected') return;
    
    setIsListening(true);
    toast({
      title: "Écoute activée",
      description: "Parlez maintenant...",
      duration: 2000,
    });
    
    // Simulation d'activité audio
    const interval = setInterval(() => {
      setVolume(Math.random() * 0.8);
    }, 100);
    
    // Arrêt automatique après 5 secondes
    setTimeout(() => {
      setIsListening(false);
      setVolume(0);
      clearInterval(interval);
      toast({
        title: "Écoute terminée",
        description: "Traitement de votre message...",
        duration: 2000,
      });
    }, 5000);
  };

  const handleStopListening = () => {
    setIsListening(false);
    setVolume(0);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Zap className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'disconnected':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Bot className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connecté';
      case 'connecting':
        return 'Connexion...';
      case 'disconnected':
        return 'Déconnecté';
      default:
        return 'Non initialisé';
    }
  };

  return (
    <div className="p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 rounded-xl border border-blue-200">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-purple-600" />
              <span className="text-lg font-bold">Synapse Voice Assistant</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className={`text-sm font-medium ${
                status === 'connected' ? 'text-green-600' : 
                status === 'connecting' ? 'text-blue-600' : 
                'text-gray-600'
              }`}>
                {getStatusText()}
              </span>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Visualiseur de volume simplifié */}
          <div className="flex items-center justify-center h-20 bg-white rounded-lg border">
            {isListening ? (
              <div className="flex items-center gap-1">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full transition-all duration-150"
                    style={{
                      height: `${20 + Math.random() * volume * 40}px`,
                      animationDelay: `${i * 100}ms`
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-500">
                <Bot className="w-5 h-5" />
                <span className="text-sm">
                  {status === 'connected' ? 'Prêt à écouter' : 'En attente de connexion'}
                </span>
              </div>
            )}
          </div>

          {/* Contrôles principaux */}
          <div className="space-y-3">
            {/* Connexion */}
            <div className="flex justify-center">
              {status !== 'connected' ? (
                <Button
                  onClick={handleConnect}
                  disabled={status === 'connecting'}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  {status === 'connecting' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Se connecter
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleDisconnect}
                  variant="destructive"
                  className="w-full"
                  size="lg"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Déconnecter
                </Button>
              )}
            </div>

            {/* Contrôles audio */}
            {status === 'connected' && (
              <div className="flex gap-2">
                <Button
                  onClick={isListening ? handleStopListening : handleStartListening}
                  className={`flex-1 ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                  size="lg"
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Arrêter
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Parler
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="px-4"
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* État du système */}
          <div className="bg-white p-3 rounded-lg border text-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-500" />
              <span className="font-medium">État du système</span>
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Utilisateur:</span>
                <span className="font-medium">{user?.email || 'Non connecté'}</span>
              </div>
              <div className="flex justify-between">
                <span>Rôle:</span>
                <span className="font-medium capitalize">{user?.user_metadata?.role || 'Client'}</span>
              </div>
              <div className="flex justify-between">
                <span>Voice AI:</span>
                <span className={`font-medium ${status === 'connected' ? 'text-green-600' : 'text-orange-600'}`}>
                  {status === 'connected' ? '🎤 Disponible' : '⏳ En attente'}
                </span>
              </div>
            </div>
          </div>

          {/* Message d'information */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-center text-sm text-blue-700">
            <p className="font-medium mb-1">Version démo simplifiée</p>
            <p className="text-xs">
              Interface vocale fonctionnelle avec simulation audio pour le déploiement Lovable
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SynapseVoiceInterface;
