/**
 * Streamer audio avancé pour Synapse Voice Assistant
 * Inspiré de l'implémentation Google Gemini Live API
 * Gestion optimisée du streaming audio bidirectionnel
 */

import { EventEmitter } from 'events';
import { 
  registerWorklet, 
  getWorklet, 
  sendMessageToWorklet, 
  cleanupWorklets,
  SYNAPSE_WORKLET_CONFIGS 
} from './audioworklet-registry';
import SynapseVolumeMeterWorklet from './worklets/synapse-volume-meter';
import SynapseAudioProcessorWorklet from './worklets/synapse-audio-processor';

export interface SynapseAudioConfig {
  sampleRate?: number;
  bufferSize?: number;
  enableVolumeMonitoring?: boolean;
  enableVoiceActivityDetection?: boolean;
  enablePreEmphasis?: boolean;
  enableNoiseGate?: boolean;
  speechThreshold?: number;
  noiseThreshold?: number;
}

export interface VolumeData {
  volume: number;
  rms: number;
  isSpeaking: boolean;
  speakingDuration: number;
  timestamp: number;
  isNoise: boolean;
}

export interface AudioChunkData {
  int16arrayBuffer: ArrayBuffer;
  sampleRate: number;
  channels: number;
  samplesCount: number;
  timestamp: number;
}

export interface SpeechStateData {
  isSpeaking: boolean;
  timestamp: number;
  duration: number;
}

export interface AudioStatsData {
  processedSamples: number;
  droppedSamples: number;
  bufferUtilization: number;
  downsampleRatio: number;
  timestamp: number;
}

/**
 * Streamer audio bidirectionnel pour Synapse
 */
export class SynapseAudioStreamer extends EventEmitter {
  private context: AudioContext;
  private config: Required<SynapseAudioConfig>;
  
  // Nœuds audio
  private gainNode: GainNode;
  private inputGainNode: GainNode;
  private outputGainNode: GainNode;
  
  // État du streaming
  private isInitialized: boolean = false;
  private isStreaming: boolean = false;
  private isPlaying: boolean = false;
  
  // Queue audio pour la lecture
  private audioQueue: Float32Array[] = [];
  private scheduledTime: number = 0;
  private initialBufferTime: number = 0.1; // 100ms de buffer initial
  
  // Source audio en cours
  private currentAudioSource: AudioBufferSourceNode | null = null;
  private endOfQueueSource: AudioBufferSourceNode | null = null;
  
  // Métriques et monitoring
  private stats: {
    inputSamples: number;
    outputSamples: number;
    droppedFrames: number;
    bufferUnderruns: number;
    lastVolumeUpdate: number;
  } = {
    inputSamples: 0,
    outputSamples: 0,
    droppedFrames: 0,
    bufferUnderruns: 0,
    lastVolumeUpdate: 0
  };

  constructor(context: AudioContext, config: SynapseAudioConfig = {}) {
    super();
    
    this.context = context;
    this.config = {
      sampleRate: 16000,
      bufferSize: 2048,
      enableVolumeMonitoring: true,
      enableVoiceActivityDetection: true,
      enablePreEmphasis: true,
      enableNoiseGate: true,
      speechThreshold: 0.05,
      noiseThreshold: 0.01,
      ...config
    };

    // Créer les nœuds audio
    this.gainNode = this.context.createGain();
    this.inputGainNode = this.context.createGain();
    this.outputGainNode = this.context.createGain();
    
    // Configuration initiale des gains
    this.gainNode.gain.value = 1.0;
    this.inputGainNode.gain.value = 1.0;
    this.outputGainNode.gain.value = 1.0;
    
    // Connexions
    this.outputGainNode.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);

    // Gestionnaires d'événements
    this.setupEventHandlers();
  }

  /**
   * Initialise les worklets audio
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Registrer le worklet de mesure de volume
      if (this.config.enableVolumeMonitoring) {
        await registerWorklet(
          this.context,
          SYNAPSE_WORKLET_CONFIGS.volumeMeter.name,
          SynapseVolumeMeterWorklet,
          this.handleVolumeEvent.bind(this)
        );

        // Configurer le worklet de volume
        sendMessageToWorklet(this.context, SYNAPSE_WORKLET_CONFIGS.volumeMeter.name, {
          updateIntervalInMS: 25,
          speechThreshold: this.config.speechThreshold,
          noiseThreshold: this.config.noiseThreshold
        });
      }

      // Registrer le worklet de traitement audio
      await registerWorklet(
        this.context,
        SYNAPSE_WORKLET_CONFIGS.audioProcessor.name,
        SynapseAudioProcessorWorklet,
        this.handleAudioProcessorEvent.bind(this)
      );

      // Configurer le worklet de traitement
      sendMessageToWorklet(this.context, SYNAPSE_WORKLET_CONFIGS.audioProcessor.name, {
        type: 'configure',
        data: {
          bufferSize: this.config.bufferSize,
          targetSampleRate: this.config.sampleRate,
          enablePreEmphasis: this.config.enablePreEmphasis,
          enableNoiseGate: this.config.enableNoiseGate,
          noiseGateThreshold: this.config.noiseThreshold
        }
      });

      this.isInitialized = true;
      this.emit('initialized');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des worklets:', error);
      throw error;
    }
  }

  /**
   * Démarre le streaming audio d'entrée
   */
  async startInputStream(mediaStream: MediaStream): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Créer la source à partir du stream
      const source = this.context.createMediaStreamSource(mediaStream);
      
      // Connecter le volume meter si activé
      if (this.config.enableVolumeMonitoring) {
        const volumeMeterNode = getWorklet(this.context, SYNAPSE_WORKLET_CONFIGS.volumeMeter.name);
        if (volumeMeterNode) {
          source.connect(this.inputGainNode);
          this.inputGainNode.connect(volumeMeterNode);
        }
      }

      // Connecter le processeur audio
      const audioProcessorNode = getWorklet(this.context, SYNAPSE_WORKLET_CONFIGS.audioProcessor.name);
      if (audioProcessorNode) {
        source.connect(audioProcessorNode);
      }

      this.isStreaming = true;
      this.emit('streamStarted');
    } catch (error) {
      console.error('Erreur lors du démarrage du stream d\'entrée:', error);
      throw error;
    }
  }

  /**
   * Arrête le streaming audio d'entrée
   */
  stopInputStream(): void {
    if (this.isStreaming) {
      // Les connexions se ferment automatiquement quand le MediaStream se ferme
      this.isStreaming = false;
      this.emit('streamStopped');
    }
  }

  /**
   * Ajoute des données audio PCM16 à la queue de lecture
   */
  addPCM16(chunk: Uint8Array): void {
    const float32Array = this.processPCM16Chunk(chunk);
    this.audioQueue.push(float32Array);
    
    if (!this.isPlaying) {
      this.startPlaying();
    }
  }

  /**
   * Démarre la lecture audio
   */
  private startPlaying(): void {
    if (this.isPlaying || this.audioQueue.length === 0) return;

    this.isPlaying = true;
    this.scheduledTime = this.context.currentTime + this.initialBufferTime;
    this.playNextChunk();
  }

  /**
   * Joue le prochain chunk audio
   */
  private playNextChunk(): void {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      this.emit('playbackComplete');
      return;
    }

    const chunk = this.audioQueue.shift()!;
    const audioBuffer = this.context.createBuffer(1, chunk.length, this.config.sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    channelData.set(chunk);

    const source = this.context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputGainNode);

    source.onended = () => {
      this.playNextChunk();
    };

    source.start(this.scheduledTime);
    this.scheduledTime += audioBuffer.duration;
    this.currentAudioSource = source;
    
    this.stats.outputSamples += chunk.length;
  }

  /**
   * Convertit les données PCM16 en Float32Array
   */
  private processPCM16Chunk(chunk: Uint8Array): Float32Array {
    const float32Array = new Float32Array(chunk.length / 2);
    const dataView = new DataView(chunk.buffer);
    
    for (let i = 0; i < chunk.length / 2; i++) {
      try {
        const int16 = dataView.getInt16(i * 2, true); // little-endian
        float32Array[i] = int16 / 32768.0; // Normaliser vers [-1, 1]
      } catch (error) {
        console.warn('Erreur lors de la conversion PCM16:', error);
        float32Array[i] = 0;
      }
    }
    
    return float32Array;
  }

  /**
   * Gestionnaire d'événements du worklet de volume
   */
  private handleVolumeEvent(event: MessageEvent): void {
    const { type, data } = event.data;
    
    switch (type) {
      case 'volume':
        this.stats.lastVolumeUpdate = Date.now();
        this.emit('volume', data as VolumeData);
        break;
        
      case 'speechStateChange':
        this.emit('speechStateChange', data as SpeechStateData);
        break;
    }
  }

  /**
   * Gestionnaire d'événements du worklet de traitement audio
   */
  private handleAudioProcessorEvent(event: MessageEvent): void {
    const { type, data } = event.data;
    
    switch (type) {
      case 'audioChunk':
        this.stats.inputSamples += (data as AudioChunkData).samplesCount;
        this.emit('audioChunk', data as AudioChunkData);
        break;
        
      case 'stats':
        this.emit('audioStats', data as AudioStatsData);
        break;
    }
  }

  /**
   * Configure les gestionnaires d'événements
   */
  private setupEventHandlers(): void {
    // Monitoring de performance
    setInterval(() => {
      this.emit('stats', this.stats);
    }, 5000); // Toutes les 5 secondes
  }

  /**
   * Arrête tout le streaming et nettoie les ressources
   */
  stop(): void {
    this.stopInputStream();
    
    // Arrêter la lecture
    if (this.currentAudioSource) {
      this.currentAudioSource.stop();
      this.currentAudioSource = null;
    }
    
    if (this.endOfQueueSource) {
      this.endOfQueueSource.stop();
      this.endOfQueueSource = null;
    }
    
    // Vider la queue
    this.audioQueue.length = 0;
    this.isPlaying = false;
    
    this.emit('stopped');
  }

  /**
   * Nettoie toutes les ressources
   */
  cleanup(): void {
    this.stop();
    cleanupWorklets(this.context);
    this.removeAllListeners();
    this.isInitialized = false;
  }

  /**
   * Définit le volume de sortie
   */
  setOutputVolume(volume: number): void {
    this.outputGainNode.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Définit le volume d'entrée
   */
  setInputVolume(volume: number): void {
    this.inputGainNode.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Obtient les statistiques actuelles
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Obtient la configuration actuelle
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(newConfig: Partial<SynapseAudioConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Mettre à jour les worklets si nécessaire
    if (this.isInitialized) {
      if (newConfig.speechThreshold !== undefined || newConfig.noiseThreshold !== undefined) {
        sendMessageToWorklet(this.context, SYNAPSE_WORKLET_CONFIGS.volumeMeter.name, {
          speechThreshold: this.config.speechThreshold,
          noiseThreshold: this.config.noiseThreshold
        });
      }
      
      sendMessageToWorklet(this.context, SYNAPSE_WORKLET_CONFIGS.audioProcessor.name, {
        type: 'configure',
        data: {
          enablePreEmphasis: this.config.enablePreEmphasis,
          enableNoiseGate: this.config.enableNoiseGate,
          noiseGateThreshold: this.config.noiseThreshold
        }
      });
    }
  }
}
