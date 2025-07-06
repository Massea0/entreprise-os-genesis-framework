/**
 * Hook React personnalisé pour Synapse Voice Assistant
 * Inspiré de l'implémentation Google Gemini Live API use-live-api.ts
 * Gestion de l'état et des événements du client vocal
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { 
  SynapseVoiceClient, 
  SynapseVoiceOptions, 
  ConnectionStatus, 
  EnterpriseContext,
  SynapseMessage,
  SynapseToolCall,
  SynapseError,
  VolumeData,
  SpeechStateData
} from '../lib/synapse-voice-client';

export interface UseSynapseVoiceResults {
  // Client et configuration
  client: SynapseVoiceClient;
  status: ConnectionStatus;
  isConnected: boolean;
  context: EnterpriseContext;
  sessionId: string | null;

  // Méthodes de contrôle
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  updateContext: (newContext: Partial<EnterpriseContext>) => void;

  // Audio
  startAudioStream: () => Promise<void>;
  stopAudioStream: () => void;
  isListening: boolean;
  volume: number;
  isSpeaking: boolean;

  // Messages et historique
  messages: SynapseMessage[];
  lastMessage: SynapseMessage | null;
  clearHistory: () => void;

  // Tool calls
  pendingToolCalls: SynapseToolCall[];
  respondToToolCall: (callId: string, response: any) => void;

  // État et erreurs
  error: SynapseError | null;
  connectionQuality: 'poor' | 'good' | 'excellent';
  metrics: any;

  // Configuration
  setInputVolume: (volume: number) => void;
  setOutputVolume: (volume: number) => void;
}

export function useSynapseVoice(options: SynapseVoiceOptions): UseSynapseVoiceResults {
  // Création du client avec mémoisation
  const client = useMemo(() => new SynapseVoiceClient(options), [
    options.supabaseUrl,
    options.supabaseKey,
    options.context.userId,
    options.context.sessionId
  ]);

  // État de connexion
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [context, setContext] = useState<EnterpriseContext>(options.context);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // État audio
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Messages et communication
  const [messages, setMessages] = useState<SynapseMessage[]>([]);
  const [lastMessage, setLastMessage] = useState<SynapseMessage | null>(null);
  const [pendingToolCalls, setPendingToolCalls] = useState<SynapseToolCall[]>([]);

  // État et erreurs
  const [error, setError] = useState<SynapseError | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'poor' | 'good' | 'excellent'>('good');
  const [metrics, setMetrics] = useState<any>({});

  // Références pour éviter les re-renders
  const audioStreamingRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Valeurs dérivées
  const isConnected = status === 'connected';

  /**
   * Configuration des gestionnaires d'événements du client
   */
  useEffect(() => {
    // Événements de connexion
    const handleStatusChange = (newStatus: ConnectionStatus) => {
      console.log('[useSynapseVoice] Status change:', newStatus);
      setStatus(newStatus);
      if (newStatus === 'connected') {
        setSessionId(client.sessionId);
        setError(null);
      }
    };

    const handleConnected = () => {
      console.log('[useSynapseVoice] Client Synapse connecté');
      setStatus('connected');
      setError(null);
    };

    const handleDisconnected = (reason?: string) => {
      console.log('[useSynapseVoice] Client Synapse déconnecté:', reason);
      setStatus('disconnected');
      setIsListening(false);
      audioStreamingRef.current = false;
    };

    const handleError = (clientError: SynapseError) => {
      console.error('[useSynapseVoice] Erreur client Synapse:', clientError);
      setError(clientError);
      
      // Arrêter l'audio en cas d'erreur non récupérable
      if (!clientError.recoverable && isListening) {
        stopAudioStream();
      }
    };

    // Événements audio
    const handleVolume = (volumeData: VolumeData) => {
      setVolume(volumeData.volume);
      setIsSpeaking(volumeData.isSpeaking);
    };

    const handleSpeechStateChange = (speechData: SpeechStateData) => {
      setIsSpeaking(speechData.isSpeaking);
    };

    const handleAudio = (audioData: ArrayBuffer) => {
      // Audio reçu du serveur - déjà géré par l'AudioStreamer
    };

    // Événements de messages
    const handleMessage = (message: SynapseMessage) => {
      setMessages(prev => [...prev, message]);
      setLastMessage(message);
    };

    const handleMessageReceived = (message: SynapseMessage) => {
      // Message spécifiquement reçu du serveur
    };

    // Événements de contexte
    const handleContextUpdated = (newContext: EnterpriseContext) => {
      setContext(newContext);
    };

    // Événements de tool calls
    const handleToolCall = (toolCall: SynapseToolCall) => {
      setPendingToolCalls(prev => [...prev, toolCall]);
    };

    const handleToolCallResponse = (response: any) => {
      setPendingToolCalls(prev => 
        prev.filter(call => call.id !== response.id)
      );
    };

    // Événements de monitoring
    const handleStats = (clientMetrics: any) => {
      setMetrics(clientMetrics);
      
      // Mise à jour de la qualité de connexion basée sur les métriques
      const quality = client.getConnectionQuality();
      setConnectionQuality(quality);
    };

    // Enregistrement des gestionnaires
    client.on('statusChange', handleStatusChange);
    client.on('connected', handleConnected);
    client.on('disconnected', handleDisconnected);
    client.on('error', handleError);
    client.on('volume', handleVolume);
    client.on('speechStateChange', handleSpeechStateChange);
    client.on('audio', handleAudio);
    client.on('message', handleMessage);
    client.on('messageReceived', handleMessageReceived);
    client.on('contextUpdated', handleContextUpdated);
    client.on('toolCall', handleToolCall);
    client.on('toolCallResponse', handleToolCallResponse);
    client.on('stats', handleStats);

    // Nettoyage
    return () => {
      client.removeAllListeners();
    };
  }, [client]);

  /**
   * Méthodes de contrôle
   */
  const connect = useCallback(async () => {
    console.log('[useSynapseVoice] connect() appelé, status actuel:', status);
    try {
      setStatus('connecting');
      await client.connect();
      console.log('[useSynapseVoice] connect() terminé avec succès');
    } catch (err) {
      console.error('[useSynapseVoice] Erreur lors de la connexion:', err);
      setStatus('error');
      throw err;
    }
  }, [client, status]);

  const disconnect = useCallback(async () => {
    console.log('[useSynapseVoice] disconnect() appelé');
    try {
      // Arrêter l'audio d'abord
      if (isListening) {
        stopAudioStream();
      }
      
      setStatus('disconnected');
      await client.disconnect();
      console.log('[useSynapseVoice] disconnect() terminé avec succès');
    } catch (err) {
      console.error('[useSynapseVoice] Erreur lors de la déconnexion:', err);
      throw err;
    }
  }, [client, isListening]);

  const sendMessage = useCallback(async (content: string) => {
    try {
      await client.sendMessage(content);
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err);
      throw err;
    }
  }, [client]);

  const updateContext = useCallback((newContext: Partial<EnterpriseContext>) => {
    client.updateContext(newContext);
  }, [client]);

  /**
   * Méthodes audio
   */
  const startAudioStream = useCallback(async () => {
    if (!isConnected) {
      throw new Error('Client non connecté');
    }

    if (audioStreamingRef.current) {
      console.warn('Stream audio déjà en cours');
      return;
    }

    try {
      await client.startAudioStream();
      audioStreamingRef.current = true;
      setIsListening(true);
    } catch (err) {
      console.error('Erreur lors du démarrage du stream audio:', err);
      audioStreamingRef.current = false;
      setIsListening(false);
      throw err;
    }
  }, [client, isConnected]);

  const stopAudioStream = useCallback(() => {
    if (audioStreamingRef.current) {
      client.stopAudioStream();
      audioStreamingRef.current = false;
      setIsListening(false);
      setVolume(0);
      setIsSpeaking(false);
    }
  }, [client]);

  /**
   * Méthodes de gestion des messages
   */
  const clearHistory = useCallback(() => {
    setMessages([]);
    setLastMessage(null);
    client.clearMessageHistory();
  }, [client]);

  /**
   * Méthodes de tool calls
   */
  const respondToToolCall = useCallback((callId: string, response: any) => {
    client.respondToToolCall(callId, response);
  }, [client]);

  /**
   * Méthodes de configuration audio
   */
  const setInputVolume = useCallback((volume: number) => {
    if (client && (client as any).audioStreamer) {
      (client as any).audioStreamer.setInputVolume(volume);
    }
  }, [client]);

  const setOutputVolume = useCallback((volume: number) => {
    if (client && (client as any).audioStreamer) {
      (client as any).audioStreamer.setOutputVolume(volume);
    }
  }, [client]);

  /**
   * Nettoyage à la destruction du composant
   */
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (isListening) {
        stopAudioStream();
      }
      
      if (isConnected) {
        client.disconnect();
      }
    };
  }, [client, isConnected, isListening, stopAudioStream]);

  /**
   * Gestion automatique de la reconnexion en cas d'erreur récupérable
   */
  useEffect(() => {
    if (error && error.recoverable && status === 'error') {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Tentative de reconnexion automatique...');
        connect().catch(err => {
          console.error('Reconnexion automatique échouée:', err);
        });
      }, 5000); // Reconnexion après 5 secondes
    }
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [error, status, connect]);

  /**
   * Surveillance de la qualité de connexion
   */
  useEffect(() => {
    if (!isConnected) return;

    const qualityCheckInterval = setInterval(() => {
      const currentQuality = client.getConnectionQuality();
      setConnectionQuality(currentQuality);
      
      if (currentQuality === 'poor' && isListening) {
        console.warn('Qualité de connexion dégradée, considérer l\'arrêt de l\'audio');
      }
    }, 5000);

    return () => clearInterval(qualityCheckInterval);
  }, [client, isConnected, isListening]);

  return {
    // Client et configuration
    client,
    status,
    isConnected,
    context,
    sessionId,

    // Méthodes de contrôle
    connect,
    disconnect,
    sendMessage,
    updateContext,

    // Audio
    startAudioStream,
    stopAudioStream,
    isListening,
    volume,
    isSpeaking,

    // Messages et historique
    messages,
    lastMessage,
    clearHistory,

    // Tool calls
    pendingToolCalls,
    respondToToolCall,

    // État et erreurs
    error,
    connectionQuality,
    metrics,

    // Configuration
    setInputVolume,
    setOutputVolume,
  };
}

/**
 * Hook simplifié pour des cas d'usage basiques
 */
export function useSynapseVoiceSimple(
  supabaseUrl: string,
  supabaseKey: string,
  context: EnterpriseContext
) {
  return useSynapseVoice({
    supabaseUrl,
    supabaseKey,
    context,
    autoReconnect: true,
    maxReconnectAttempts: 3,
    reconnectDelay: 2000,
    audioConfig: {
      sampleRate: 16000,
      enableVAD: true,
      speechThreshold: 0.05
    }
  });
}
