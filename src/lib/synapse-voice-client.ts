/**
 * Client principal pour Synapse Voice Assistant
 * Inspiré de l'implémentation Google Gemini Live API
 * Architecture event-driven avec WebSocket robuste et gestion du contexte entreprise
 */

import { EventEmitter } from 'eventemitter3';
import { safeRandomUUID, isWebRTCSupported, getEnvVar, safeLog } from './build-polyfills';
import { SynapseAudioStreamer, AudioChunkData, VolumeData, SpeechStateData } from './synapse-audio-streamer';

// Ré-export des types pour l'API publique
export type { VolumeData, SpeechStateData, AudioChunkData } from './synapse-audio-streamer';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface EnterpriseContext {
  userId: string;
  userRole: 'admin' | 'employee' | 'client';
  companyId?: string;
  companyName?: string;
  permissions: string[];
  sessionId: string;
}

export interface SynapseVoiceOptions {
  supabaseUrl: string;
  supabaseKey: string;
  context: EnterpriseContext;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  audioConfig?: {
    sampleRate?: number;
    enableVAD?: boolean;
    speechThreshold?: number;
  };
}

export interface SynapseMessage {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'error';
  content: string;
  timestamp: number;
  context?: Partial<EnterpriseContext>;
  metadata?: Record<string, any>;
}

export interface SynapseToolCall {
  id: string;
  type: string;
  parameters: Record<string, any>;
  context: EnterpriseContext;
  timestamp: number;
}

export interface SynapseToolCallResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

export interface SynapseError {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
  timestamp: number;
}

export interface SynapseClientEventTypes {
  // Événements de connexion
  statusChange: (status: ConnectionStatus) => void;
  connected: () => void;
  disconnected: (reason?: string) => void;
  error: (error: SynapseError) => void;
  
  // Événements audio
  audio: (data: ArrayBuffer) => void;
  volume: (data: VolumeData) => void;
  speechStateChange: (data: SpeechStateData) => void;
  
  // Événements de messages
  message: (message: SynapseMessage) => void;
  messageReceived: (message: SynapseMessage) => void;
  messageSent: (message: SynapseMessage) => void;
  
  // Événements de contexte
  contextUpdated: (context: EnterpriseContext) => void;
  contextError: (error: SynapseError) => void;
  
  // Événements de tool calls
  toolCall: (call: SynapseToolCall) => void;
  toolCallResponse: (response: SynapseToolCallResponse) => void;
  
  // Événements de session
  sessionStarted: (sessionId: string) => void;
  sessionEnded: (sessionId: string) => void;
  
  // Événements de monitoring
  stats: (stats: any) => void;
}

/**
 * Client principal event-driven pour Synapse Voice Assistant
 */
export class SynapseVoiceClient extends EventEmitter {
  private options: Required<SynapseVoiceOptions>;
  private _status: ConnectionStatus = 'disconnected';
  private _context: EnterpriseContext;
  private _sessionId: string | null = null;
  
  // WebSocket et connexion
  private websocket: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastHeartbeat: number = 0;
  
  // Audio streaming
  private audioStreamer: SynapseAudioStreamer | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  
  // État et cache
  private messageHistory: SynapseMessage[] = [];
  private pendingToolCalls = new Map<string, SynapseToolCall>();
  private connectionQuality: 'poor' | 'good' | 'excellent' = 'good';
  
  // Métriques
  private metrics = {
    messagesReceived: 0,
    messagesSent: 0,
    audioChunksSent: 0,
    audioChunksReceived: 0,
    reconnections: 0,
    errors: 0,
    lastActivity: Date.now()
  };

  constructor(options: SynapseVoiceOptions) {
    super();
    
    this.options = {
      autoReconnect: true,
      maxReconnectAttempts: 5,
      reconnectDelay: 2000,
      audioConfig: {
        sampleRate: 16000,
        enableVAD: true,
        speechThreshold: 0.05
      },
      ...options
    };
    
    this._context = options.context;
    this._sessionId = this.generateSessionId();
    
    // Configuration des gestionnaires d'événements
    this.setupEventHandlers();
    
    safeLog.info('SynapseVoiceClient initialized', { 
      sessionId: this._sessionId,
      webRTCSupported: isWebRTCSupported()
    });
  }

  /**
   * Getters pour l'état public
   */
  get status(): ConnectionStatus {
    return this._status;
  }

  get context(): EnterpriseContext {
    return { ...this._context };
  }

  get sessionId(): string | null {
    return this._sessionId;
  }

  get isConnected(): boolean {
    return this._status === 'connected';
  }

  get messageCount(): number {
    return this.messageHistory.length;
  }

  /**
   * Connexion au service Synapse
   */
  async connect(): Promise<void> {
    console.log('🔄 SynapseVoiceClient.connect() appelé, status:', this._status);
    
    if (this._status === 'connecting' || this._status === 'connected') {
      console.log('⚠️ Déjà en cours de connexion ou connecté');
      return;
    }

    this.setStatus('connecting');
    console.log('📡 Status changé vers "connecting"');
    
    try {
      // Initialiser le contexte audio
      console.log('🎵 Initialisation audio...');
      await this.initializeAudio();
      console.log('✅ Audio initialisé');
      
      // Établir la connexion WebSocket
      console.log('🌐 Connexion WebSocket...');
      await this.connectWebSocket();
      console.log('✅ WebSocket connecté');
      
      // Initialiser la session
      console.log('🔑 Initialisation session...');
      await this.initializeSession();
      console.log('✅ Session initialisée');
      
      this.setStatus('connected');
      this.reconnectAttempts = 0;
      this.emit('connected');
      console.log('🎉 Connexion Synapse réussie!');
      
    } catch (error) {
      console.error('Erreur de connexion Synapse:', error);
      this.handleConnectionError(error);
    }
  }

  /**
   * Déconnexion du service
   */
  async disconnect(): Promise<void> {
    this.setStatus('disconnected');
    
    // Arrêter la reconnexion automatique
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Fermer WebSocket
    if (this.websocket) {
      this.websocket.close(1000, 'Client disconnect');
      this.websocket = null;
    }
    
    // Arrêter l'audio
    this.cleanupAudio();
    
    // Arrêter le heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    this.emit('disconnected');
  }

  /**
   * Envoi d'un message texte
   */
  async sendMessage(content: string, type: 'user' | 'system' = 'user'): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Client non connecté');
    }

    const message: SynapseMessage = {
      id: this.generateMessageId(),
      type,
      content,
      timestamp: Date.now(),
      context: this._context
    };

    this.sendWebSocketMessage({
      type: 'message',
      data: message
    });

    this.messageHistory.push(message);
    this.metrics.messagesSent++;
    this.emit('messageSent', message);
  }

  /**
   * Démarrage du streaming audio
   */
  async startAudioStream(): Promise<void> {
    if (!this.isConnected || !this.audioStreamer) {
      throw new Error('Client non connecté ou audio non initialisé');
    }

    try {
      // Obtenir l'accès au microphone
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.options.audioConfig.sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Démarrer le streaming audio
      await this.audioStreamer.startInputStream(this.mediaStream);
      
      this.sendWebSocketMessage({
        type: 'audioStreamStart',
        data: {
          sessionId: this._sessionId,
          sampleRate: this.options.audioConfig.sampleRate
        }
      });
      
    } catch (error) {
      console.error('Erreur lors du démarrage du stream audio:', error);
      throw error;
    }
  }

  /**
   * Arrêt du streaming audio
   */
  stopAudioStream(): void {
    if (this.audioStreamer) {
      this.audioStreamer.stopInputStream();
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.isConnected) {
      this.sendWebSocketMessage({
        type: 'audioStreamStop',
        data: { sessionId: this._sessionId }
      });
    }
  }

  /**
   * Mise à jour du contexte entreprise
   */
  updateContext(newContext: Partial<EnterpriseContext>): void {
    this._context = { ...this._context, ...newContext };
    
    if (this.isConnected) {
      this.sendWebSocketMessage({
        type: 'contextUpdate',
        data: this._context
      });
    }
    
    this.emit('contextUpdated', this._context);
  }

  /**
   * Réponse à un tool call
   */
  respondToToolCall(callId: string, response: any): void {
    const toolCall = this.pendingToolCalls.get(callId);
    if (!toolCall) {
      console.warn(`Tool call ${callId} non trouvé`);
      return;
    }

    const toolResponse: SynapseToolCallResponse = {
      id: callId,
      success: true,
      data: response,
      timestamp: Date.now()
    };

    this.sendWebSocketMessage({
      type: 'toolCallResponse',
      data: toolResponse
    });

    this.pendingToolCalls.delete(callId);
    this.emit('toolCallResponse', toolResponse);
  }

  /**
   * Initialisation du contexte audio
   */
  private async initializeAudio(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    if (!this.audioStreamer) {
      this.audioStreamer = new SynapseAudioStreamer(this.audioContext, {
        sampleRate: this.options.audioConfig.sampleRate,
        enableVoiceActivityDetection: this.options.audioConfig.enableVAD,
        speechThreshold: this.options.audioConfig.speechThreshold
      });

      await this.audioStreamer.initialize();
      this.setupAudioEventHandlers();
    }
  }

  /**
   * Configuration des gestionnaires d'événements audio
   */
  private setupAudioEventHandlers(): void {
    if (!this.audioStreamer) return;

    this.audioStreamer.on('volume', (data: VolumeData) => {
      this.emit('volume', data);
    });

    this.audioStreamer.on('speechStateChange', (data: SpeechStateData) => {
      this.emit('speechStateChange', data);
    });

    this.audioStreamer.on('audioChunk', (data: AudioChunkData) => {
      if (this.isConnected) {
        const base64Audio = this.arrayBufferToBase64(data.int16arrayBuffer);
        this.sendWebSocketMessage({
          type: 'audioChunk',
          data: {
            audio: base64Audio,
            sampleRate: data.sampleRate,
            timestamp: data.timestamp
          }
        });
        this.metrics.audioChunksSent++;
      }
    });
  }

  /**
   * Connexion WebSocket
   */
  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `${this.options.supabaseUrl.replace('https:', 'wss:')}/functions/v1/synapse-live-voice`;
      
      this.websocket = new WebSocket(wsUrl);
      
      this.websocket.onopen = () => {
        console.log('WebSocket connecté');
        this.startHeartbeat();
        resolve();
      };
      
      this.websocket.onmessage = (event) => {
        this.handleWebSocketMessage(event);
      };
      
      this.websocket.onclose = (event) => {
        console.log('WebSocket fermé:', event.code, event.reason);
        this.handleWebSocketClose(event);
      };
      
      this.websocket.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        reject(error);
      };
      
      // Timeout de connexion
      setTimeout(() => {
        if (this.websocket?.readyState !== WebSocket.OPEN) {
          reject(new Error('Timeout de connexion WebSocket'));
        }
      }, 10000);
    });
  }

  /**
   * Gestion des messages WebSocket
   */
  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      this.metrics.lastActivity = Date.now();
      
      safeLog.debug('WebSocket message reçu:', { type: message.type, timestamp: message.timestamp });
      
      switch (message.type) {
        // Messages du protocole Synapse edge function
        case 'connection_established':
          console.log('✅ Connexion Synapse établie:', message.message);
          if (message.features) {
            console.log('🎯 Fonctionnalités disponibles:', message.features);
          }
          // Ne pas passer à 'connected' tout de suite, attendre context_loaded
          this.setStatus('connecting');
          this.emit('connectionEstablished', message);
          break;
          
        case 'context_loaded':
          console.log('🧠 Contexte Synapse chargé:', message.message);
          if (message.stats) {
            console.log('📊 Statistiques du contexte:', message.stats);
          }
          // Maintenant on peut considérer la connexion comme complètement établie
          this.setStatus('connected');
          this.emit('connected');
          this.emit('contextLoaded', message);
          break;
          
        case 'ai_response':
          console.log('🤖 Réponse IA reçue:', message.message?.substring(0, 100) + '...');
          const aiMessage: SynapseMessage = {
            id: this.generateMessageId(),
            type: 'assistant',
            content: message.message,
            timestamp: message.timestamp ? new Date(message.timestamp).getTime() : Date.now(),
            metadata: {
              confidence: message.confidence,
              source: message.source
            }
          };
          this.handleIncomingMessage(aiMessage);
          break;
          
        case 'pong':
          console.log('🏓 Pong reçu du serveur');
          this.lastHeartbeat = Date.now();
          this.emit('pong', message);
          break;
          
        case 'context_error':
          console.error('❌ Erreur de contexte Synapse:', message.message);
          this.emit('error', new Error(`Erreur de contexte: ${message.message}`));
          break;
          
        case 'context_refreshed':
          console.log('🔄 Contexte Synapse rafraîchi:', message.message);
          this.emit('contextRefreshed', message);
          break;
          
        case 'warning':
          console.warn('⚠️ Avertissement Synapse:', message.message || 'Avertissement sans détails');
          if (message.received_type) {
            console.warn('   Type de message non supporté:', message.received_type);
          }
          this.emit('warning', message);
          break;
          
        case 'error':
          console.error('❌ Erreur Synapse:', message.message || 'Erreur sans détails');
          if (message.details) {
            console.error('   Détails:', message.details);
          }
          this.emit('error', new Error(message.message || 'Erreur du serveur Synapse'));
          break;

        // Messages du protocole legacy (rétrocompatibilité)
        case 'message':
          this.handleIncomingMessage(message.data);
          break;
          
        case 'audio':
          this.handleIncomingAudio(message.data);
          break;
          
        case 'toolCall':
          this.handleToolCall(message.data);
          break;
          
        case 'contextUpdate':
          this.handleContextUpdate(message.data);
          break;
          
        case 'heartbeat':
          this.lastHeartbeat = Date.now();
          break;
          
        case 'session_ready':
          console.log('✅ Session Synapse prête (legacy)');
          this.setStatus('connected');
          this.emit('connected');
          break;
          
        default:
          console.warn('Type de message WebSocket non reconnu:', message.type, message);
          this.emit('unknownMessage', message);
      }
      
    } catch (error) {
      console.error('Erreur lors du parsing du message WebSocket:', error);
      this.emit('error', error);
    }
  }

  /**
   * Gestion des messages entrants
   */
  private handleIncomingMessage(messageData: SynapseMessage): void {
    this.messageHistory.push(messageData);
    this.metrics.messagesReceived++;
    this.emit('messageReceived', messageData);
    this.emit('message', messageData);
  }

  /**
   * Gestion de l'audio entrant
   */
  private handleIncomingAudio(audioData: any): void {
    if (this.audioStreamer && audioData.audio) {
      const audioBuffer = this.base64ToArrayBuffer(audioData.audio);
      const uint8Array = new Uint8Array(audioBuffer);
      this.audioStreamer.addPCM16(uint8Array);
      this.metrics.audioChunksReceived++;
      this.emit('audio', audioBuffer);
    }
  }

  /**
   * Gestion des tool calls
   */
  private handleToolCall(toolCallData: SynapseToolCall): void {
    this.pendingToolCalls.set(toolCallData.id, toolCallData);
    this.emit('toolCall', toolCallData);
  }

  /**
   * Gestion des mises à jour de contexte
   */
  private handleContextUpdate(contextData: Partial<EnterpriseContext>): void {
    this._context = { ...this._context, ...contextData };
    this.emit('contextUpdated', this._context);
  }

  /**
   * Gestion des erreurs serveur
   */
  private handleServerError(errorData: any): void {
    const error: SynapseError = {
      code: errorData.code || 'UNKNOWN_ERROR',
      message: errorData.message || 'Erreur inconnue',
      details: errorData.details,
      recoverable: errorData.recoverable !== false,
      timestamp: Date.now()
    };
    
    this.metrics.errors++;
    this.emit('error', error);
  }

  /**
   * Initialisation de la session
   */
  private async initializeSession(): Promise<void> {
    this.sendWebSocketMessage({
      type: 'init_context',
      userId: this._context.userId,
      userRole: this._context.userRole,
      sessionId: this._sessionId,
      context: this._context,
      audioConfig: this.options.audioConfig
    });
  }

  /**
   * Démarrage du heartbeat
   */
  private startHeartbeat(): void {
    this.lastHeartbeat = Date.now();
    this.heartbeatTimer = setInterval(() => {
      if (this.websocket?.readyState === WebSocket.OPEN) {
        this.sendWebSocketMessage({ type: 'ping', timestamp: Date.now() });
        
        // Vérifier si on a reçu un heartbeat récemment
        if (Date.now() - this.lastHeartbeat > 30000) {
          console.warn('Heartbeat manqué, possible problème de connexion');
          this.connectionQuality = 'poor';
        }
      }
    }, 10000); // Heartbeat toutes les 10 secondes
  }

  /**
   * Envoi de message WebSocket
   */
  private sendWebSocketMessage(message: any): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    }
  }

  /**
   * Gestion de la fermeture WebSocket
   */
  private handleWebSocketClose(event: CloseEvent): void {
    this.websocket = null;
    
    if (this._status !== 'disconnected' && this.options.autoReconnect) {
      this.attemptReconnection();
    } else {
      this.setStatus('disconnected');
      this.emit('disconnected', event.reason);
    }
  }

  /**
   * Tentative de reconnexion
   */
  private attemptReconnection(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.setStatus('error');
      this.emit('error', {
        code: 'MAX_RECONNECT_ATTEMPTS',
        message: 'Nombre maximum de tentatives de reconnexion atteint',
        recoverable: false,
        timestamp: Date.now()
      });
      return;
    }

    this.setStatus('reconnecting');
    this.reconnectAttempts++;
    this.metrics.reconnections++;

    const delay = this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connectWebSocket();
        await this.initializeSession();
        this.setStatus('connected');
        this.emit('connected');
      } catch (error) {
        console.error(`Tentative de reconnexion ${this.reconnectAttempts} échouée:`, error);
        this.attemptReconnection();
      }
    }, delay);
  }

  /**
   * Gestion des erreurs de connexion
   */
  private handleConnectionError(error: any): void {
    this.setStatus('error');
    this.emit('error', {
      code: 'CONNECTION_ERROR',
      message: error.message || 'Erreur de connexion',
      details: error,
      recoverable: true,
      timestamp: Date.now()
    });
  }

  /**
   * Définition du statut
   */
  private setStatus(status: ConnectionStatus): void {
    if (this._status !== status) {
      this._status = status;
      this.emit('statusChange', status);
    }
  }

  /**
   * Configuration des gestionnaires d'événements
   */
  private setupEventHandlers(): void {
    // Gestionnaire de fermeture de page
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.disconnect();
      });
    }
  }

  /**
   * Nettoyage de l'audio
   */
  private cleanupAudio(): void {
    if (this.audioStreamer) {
      this.audioStreamer.cleanup();
      this.audioStreamer = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  /**
   * Utilitaires
   */
  private generateSessionId(): string {
    return `synapse_${Date.now()}_${safeRandomUUID().substring(0, 8)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${safeRandomUUID().substring(0, 8)}`;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
      view[i] = binary.charCodeAt(i);
    }
    return buffer;
  }

  /**
   * API publique pour les métriques
   */
  getMetrics() {
    return { ...this.metrics };
  }

  getConnectionQuality() {
    return this.connectionQuality;
  }

  getMessageHistory() {
    return [...this.messageHistory];
  }

  clearMessageHistory(): void {
    this.messageHistory = [];
  }
}
