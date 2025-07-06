import React, { useState, useRef, useEffect } from 'react';
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
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const GeminiLiveInterface: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { refreshContext } = useAIContext();
  
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connectToSynapseLive = async () => {
    try {
      setConnectionStatus('connecting');
      setRetryCount(prev => prev + 1);
      
      // Se connecter au WebSocket Supabase Edge Function
      const wsUrl = `wss://qlqgyrfqiflnqknbtycw.supabase.co/functions/v1/synapse-live-voice`;
      console.log('🔌 Connexion à Synapse:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ Connecté à Synapse IA');
        setIsConnected(true);
        setConnectionStatus('connected');
        setRetryCount(0);
        
        // Initialiser le contexte utilisateur
        if (user) {
          wsRef.current?.send(JSON.stringify({
            type: 'init_context',
            userId: user.id,
            userRole: user.user_metadata?.role || 'client',
            timestamp: new Date().toISOString()
          }));
        }
        
        toast({
          title: "🧠 Synapse IA activé",
          description: "Assistant vocal intelligent connecté"
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Message de Synapse:', data.type);
          setLastMessage(data.message || '');
          
          // Gestion des différents types de messages
          switch (data.type) {
            case 'connection_established':
              console.log('🎉 Synapse établi:', data.message);
              break;
              
            case 'context_loaded':
              toast({
                title: "🧠 Contexte chargé",
                description: data.message
              });
              break;
              
            case 'ai_response':
              // Réponse de l'IA - on pourrait ajouter du text-to-speech ici
              console.log('🤖 Réponse IA:', data.message);
              break;
              
            case 'warning':
              console.warn('⚠️ Avertissement Synapse:', data.message);
              // Les warnings ne sont pas affichés à l'utilisateur pour éviter le spam
              break;
              
            case 'error':
              console.error('❌ Erreur Synapse:', data.message);
              toast({
                variant: "destructive",
                title: "Erreur Synapse",
                description: data.message
              });
              break;
          }
          
        } catch (error) {
          console.error('❌ Erreur traitement message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error);
        setConnectionStatus('error');
        
        // Auto-reconnexion
        if (retryCount < 3) {
          console.log(`🔄 Tentative de reconnexion ${retryCount + 1}/3`);
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connectToSynapseLive();
          }, 2000 * retryCount); // Délai progressif
        } else {
          toast({
            variant: "destructive",
            title: "Connexion échouée",
            description: "Impossible de se connecter à Synapse IA après 3 tentatives"
          });
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 Connexion fermée:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Reconnexion automatique si ce n'était pas volontaire
        if (event.code !== 1000 && retryCount < 3) {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connectToSynapseLive();
          }, 1000);
        }
      };

    } catch (error) {
      console.error('❌ Erreur connexion:', error);
      setConnectionStatus('error');
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: "Impossible d'initialiser la connexion WebSocket"
      });
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    stopRecording();
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioToSynapse(audioBlob);
      };

      mediaRecorderRef.current.start(1000); // Capturer par chunks de 1 seconde
      setIsRecording(true);

    } catch (error) {
      console.error('Erreur enregistrement:', error);
      toast({
        variant: "destructive",
        title: "Erreur microphone",
        description: "Impossible d'accéder au microphone"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const sendAudioToSynapse = async (audioBlob: Blob) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      // Convertir en base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const message = {
        client_content: {
          turns: [{
            role: "user",
            parts: [{
              inline_data: {
                mime_type: "audio/webm",
                data: base64Audio
              }
            }]
          }],
          turn_complete: true
        }
      };

      wsRef.current.send(JSON.stringify(message));
    } catch (error) {
      console.error('Erreur envoi audio:', error);
    }
  };

  const playAudioFromBase64 = async (base64Audio: string) => {
    try {
      setIsSpeaking(true);
      
      // Décoder et jouer l'audio
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBlob = new Blob([bytes], { type: 'audio/pcm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Erreur lecture audio:', error);
      setIsSpeaking(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Nettoyer les timeouts à la fermeture
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Fonction pour tester la connexion avec un message simple
  const testSynapseConnection = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const testMessage = "Bonjour Synapse, peux-tu me donner un résumé de mes projets ?";
      wsRef.current.send(JSON.stringify({
        type: 'text_input',
        message: testMessage,
        timestamp: new Date().toISOString()
      }));
      
      toast({
        title: "🧪 Test envoyé",
        description: "Message de test envoyé à Synapse IA"
      });
    } else {
      toast({
        variant: "destructive",
        title: "Non connecté",
        description: "Veuillez d'abord vous connecter à Synapse"
      });
    }
  };

  // Fonction pour rafraîchir le contexte
  const refreshSynapseContext = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'refresh_context',
        timestamp: new Date().toISOString()
      }));
      
      // Rafraîchir aussi le contexte local
      refreshContext();
      
      toast({
        title: "🔄 Contexte actualisé",
        description: "Données synchronisées avec Synapse"
      });
    }
  };

  return (
    <div className="w-full space-y-4">
        {/* Status de connexion */}
        <div className="text-center">
          {connectionStatus === 'connected' && (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm">Connecté à Synapse IA</span>
            </div>
          )}
          {connectionStatus === 'connecting' && (
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Connexion en cours...</span>
            </div>
          )}
          {connectionStatus === 'disconnected' && (
            <span className="text-sm text-muted-foreground">Non connecté</span>
          )}
          {connectionStatus === 'error' && (
            <span className="text-sm text-red-600">Erreur de connexion</span>
          )}
        </div>

        {/* Indicateurs d'état */}
        <div className="flex justify-center gap-4">
          {isRecording && (
            <div className="flex items-center gap-2 text-red-600">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs">Écoute</span>
            </div>
          )}
          {isSpeaking && (
            <div className="flex items-center gap-2 text-purple-600">
              <Volume2 className="h-4 w-4" />
              <span className="text-xs">Synapse parle</span>
            </div>
          )}
        </div>

        {/* Contrôles */}
        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={connectToSynapseLive} 
              className="flex-1"
              disabled={connectionStatus === 'connecting'}
            >
              <Zap className="h-4 w-4 mr-2" />
              Activer Synapse IA
            </Button>
          ) : (
            <>
              <Button 
                onClick={toggleRecording}
                variant={isRecording ? "destructive" : "default"} 
                className="flex-1"
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Arrêter
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Parler
                  </>
                )}
              </Button>
              <Button onClick={disconnect} variant="outline">
                Déconnecter
              </Button>
            </>
          )}
        </div>

        {/* Boutons de test et utilitaires */}
        {isConnected && (
          <div className="flex gap-2">
            <Button 
              onClick={testSynapseConnection} 
              variant="secondary" 
              size="sm"
              className="flex-1"
            >
              <Brain className="h-4 w-4 mr-1" />
              Test IA
            </Button>
            <Button 
              onClick={refreshSynapseContext} 
              variant="secondary" 
              size="sm"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualiser
            </Button>
          </div>
        )}

        {/* Affichage du dernier message */}
        {lastMessage && (
          <div className="bg-muted/50 p-3 rounded text-sm">
            <div className="flex items-start gap-2">
              <Bot className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{lastMessage}</span>
            </div>
          </div>
        )}

        {/* Informations de retry */}
        {retryCount > 0 && connectionStatus !== 'connected' && (
          <div className="flex items-center gap-2 text-amber-600 text-xs">
            <AlertCircle className="h-3 w-3" />
            <span>Tentative {retryCount}/3</span>
          </div>
        )}

      {/* Instructions */}
      <div className="text-center text-xs text-muted-foreground bg-muted/30 p-2 rounded">
        {isConnected ? 
          "Cliquez sur 'Parler' et conversez naturellement avec Synapse" :
          "Activez Synapse IA pour une conversation vocale fluide"
        }
      </div>
    </div>
  );
};
