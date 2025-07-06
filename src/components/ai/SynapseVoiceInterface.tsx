import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAIContext } from '@/components/ai/AIContextProvider';
import { useSynapseVoice } from '@/hooks/use-synapse-voice';
import { SynapseVolumeVisualizer } from './SynapseVolumeVisualizer';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Bot,
  Loader2,
  Zap,
  Brain,
  RefreshCw,
  AlertCircle,
  Play,
  Square
} from 'lucide-react';
import './synapse-voice-interface.scss';

interface SynapseMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface SynapseToolCall {
  id: string;
  type: string;
  parameters: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'error';
}

export const SynapseVoiceInterface: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { refreshContext } = useAIContext();
  
  // État local pour l'interface
  const [messages, setMessages] = useState<SynapseMessage[]>([]);
  const [toolCalls, setToolCalls] = useState<SynapseToolCall[]>([]);
  const [isOutputMuted, setIsOutputMuted] = useState(false);

  // Contexte d'entreprise basique pour le hook
  const enterpriseContext = {
    userId: user?.id || '',
    companyId: user?.id || '', // Utilisation de l'ID utilisateur comme fallback
    role: user?.role || 'employee',
    userRole: (user?.role as 'employee' | 'client' | 'admin') || 'employee',
    sessionId: crypto.randomUUID(),
    permissions: []
  };

  // Hook Synapse Voice personnalisé
  const {
    client,
    status,
    connect,
    disconnect,
    startAudioStream,
    stopAudioStream,
    volume,
    isListening,
    lastMessage,
    error,
    messages: hookMessages
  } = useSynapseVoice({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    context: enterpriseContext
  });

  // Debug logs
  useEffect(() => {
    console.log('🔍 SynapseVoiceInterface Debug:', {
      status,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length,
      enterpriseContext,
      client: !!client,
      connectFunction: !!connect
    });
  }, [status, enterpriseContext, client, connect]);

  // Gestion des événements du client
  useEffect(() => {
    if (!client) return;

    const handleMessage = (message: any) => {
      const newMessage: SynapseMessage = {
        id: crypto.randomUUID(),
        type: message.role === 'user' ? 'user' : 'assistant',
        content: message.content,
        timestamp: new Date(),
        metadata: message.metadata
      };
      
      setMessages(prev => [...prev, newMessage]);
    };

    const handleToolCall = (toolCall: any) => {
      const newToolCall: SynapseToolCall = {
        id: toolCall.id,
        type: toolCall.type,
        parameters: toolCall.parameters,
        status: 'pending'
      };
      
      setToolCalls(prev => [...prev, newToolCall]);
      
      toast({
        title: "Outil appelé",
        description: `Exécution de: ${toolCall.type}`,
        duration: 3000,
      });
    };

    const handleError = (error: any) => {
      console.error('❌ Erreur Synapse:', error);
      toast({
        title: "Erreur Synapse",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
        duration: 5000,
      });
    };

    const handleStatusChange = (newStatus: string) => {
      console.log('🔄 Statut Synapse:', newStatus);
      
      if (newStatus === 'connected') {
        toast({
          title: "Connecté",
          description: "Synapse IA est en ligne",
          duration: 3000,
        });
      } else if (newStatus === 'disconnected') {
        toast({
          title: "Déconnecté",
          description: "Synapse IA est hors ligne",
          variant: "destructive",
          duration: 3000,
        });
      }
    };

    // Écouter les événements
    client.on('message', handleMessage);
    client.on('toolcall', handleToolCall);
    client.on('error', handleError);
    client.on('statuschange', handleStatusChange);

    return () => {
      client.off('message', handleMessage);
      client.off('toolcall', handleToolCall);
      client.off('error', handleError);
      client.off('statuschange', handleStatusChange);
    };
  }, [client, toast]);

  // Gestion de la connexion
  const handleConnect = useCallback(async () => {
    console.log('🔄 Tentative de connexion...', { status, connect: !!connect });
    try {
      await refreshContext();
      console.log('✅ Contexte rafraîchi');
      await connect();
      console.log('✅ Connect() appelé');
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
    }
  }, [connect, refreshContext]);

  const handleDisconnect = useCallback(async () => {
    console.log('🔄 Tentative de déconnexion...', { status, disconnect: !!disconnect });
    try {
      await disconnect();
      setMessages([]);
      setToolCalls([]);
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur de déconnexion:', error);
    }
  }, [disconnect]);

  // Gestion de l'enregistrement
  const handleStartListening = useCallback(async () => {
    try {
      await startAudioStream();
    } catch (error) {
      console.error('❌ Erreur d\'écoute:', error);
    }
  }, [startAudioStream]);

  const handleStopListening = useCallback(async () => {
    try {
      await stopAudioStream();
    } catch (error) {
      console.error('❌ Erreur d\'arrêt:', error);
    }
  }, [stopAudioStream]);

  // Rendu des statuts de connexion
  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Zap className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'disconnected':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
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
      case 'error':
        return 'Erreur';
      default:
        return 'Non initialisé';
    }
  };

  return (
    <div className="synapse-voice-interface">
      <Card className="synapse-main-card">
        <CardHeader className="synapse-header">
          <CardTitle className="synapse-title">
            <div className="synapse-title-content">
              <Brain className="w-6 h-6 text-purple-600" />
              <span>Synapse Voice Assistant</span>
              <div className="synapse-status">
                {getStatusIcon()}
                <span className={`synapse-status-text ${status}`}>
                  {getStatusText()}
                </span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="synapse-content">
          {/* Visualiseur de volume */}
          <div className="synapse-visualizer-container">
            <SynapseVolumeVisualizer
              volume={volume}
              isListening={isListening}
              isProcessing={false}
              className="synapse-volume-visualizer"
            />
          </div>

          {/* Contrôles principaux */}
          <div className="synapse-controls">
            <div className="synapse-connection-controls">
              {status !== 'connected' ? (
                <Button
                  onClick={handleConnect}
                  disabled={status === 'connecting' || status === 'reconnecting'}
                  className="synapse-connect-btn"
                  size="lg"
                >
                  {status === 'connecting' || status === 'reconnecting' ? (
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
                  className="synapse-disconnect-btn"
                  size="lg"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Déconnecter
                </Button>
              )}
            </div>

            {/* Contrôles audio */}
            {status === 'connected' && (
              <div className="synapse-audio-controls">
                <Button
                  onClick={isListening ? handleStopListening : handleStartListening}
                  disabled={false}
                  className={`synapse-mic-btn ${isListening ? 'listening' : ''}`}
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
                  onClick={() => setIsOutputMuted(!isOutputMuted)}
                  variant="outline"
                  className="synapse-volume-btn"
                  size="lg"
                >
                  {isOutputMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Messages et historique */}
          {messages.length > 0 && (
            <div className="synapse-messages">
              <h3 className="synapse-messages-title">Conversation</h3>
              <div className="synapse-messages-list">
                {messages.slice(-3).map((message) => (
                  <div
                    key={message.id}
                    className={`synapse-message ${message.type}`}
                  >
                    <div className="synapse-message-content">
                      {message.content}
                    </div>
                    <div className="synapse-message-timestamp">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tool calls actifs */}
          {toolCalls.length > 0 && (
            <div className="synapse-tool-calls">
              <h3 className="synapse-tool-calls-title">Outils en cours</h3>
              <div className="synapse-tool-calls-list">
                {toolCalls.filter(tc => tc.status !== 'completed').map((toolCall) => (
                  <div
                    key={toolCall.id}
                    className={`synapse-tool-call ${toolCall.status}`}
                  >
                    <div className="synapse-tool-call-type">
                      {toolCall.type}
                    </div>
                    <div className="synapse-tool-call-status">
                      {toolCall.status === 'executing' && (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      )}
                      {toolCall.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="synapse-error">
              <AlertCircle className="w-4 h-4" />
              <span>{error.message || 'Erreur inconnue'}</span>
            </div>
          )}

          {/* Dernière activité */}
          {lastMessage && (
            <div className="synapse-last-activity">
              <small className="text-muted-foreground">
                Dernière activité: {lastMessage.content || 'Message vide'}
              </small>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SynapseVoiceInterface;
