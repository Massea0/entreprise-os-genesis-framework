/**
 * Worklet de traitement audio pour Synapse Voice Assistant
 * Inspiré de l'implémentation Google Gemini Live API
 * Optimisé pour la conversion et le streaming audio en temps réel
 */

const SynapseAudioProcessorWorklet = `
class SynapseAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // Configuration du buffer - optimisé pour la reconnaissance vocale
    this.bufferSize = 2048; // 2048 samples à 16kHz = ~128ms
    this.buffer = new Int16Array(this.bufferSize);
    this.bufferWriteIndex = 0;
    
    // Configuration de l'échantillonnage
    this.targetSampleRate = 16000; // Optimisé pour OpenAI/Whisper
    this.inputSampleRate = sampleRate; // Sample rate du navigateur (généralement 48kHz)
    this.downsampleRatio = this.inputSampleRate / this.targetSampleRate;
    this.downsampleCounter = 0;
    
    // Filtres et traitement
    this.preEmphasisFactor = 0.97; // Pré-emphase pour améliorer la qualité vocale
    this.previousSample = 0;
    
    // Gestion de la qualité audio
    this.enablePreEmphasis = true;
    this.enableDownsampling = this.inputSampleRate !== this.targetSampleRate;
    this.enableNoiseGate = true;
    this.noiseGateThreshold = 0.001; // Seuil de bruit très bas
    
    // Stats et monitoring
    this.processedSamples = 0;
    this.droppedSamples = 0;
    this.lastStatsReport = 0;
    
    this.port.onmessage = event => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'configure':
          this.configure(data);
          break;
        case 'reset':
          this.reset();
          break;
        case 'getStats':
          this.sendStats();
          break;
      }
    };
  }

  configure(config) {
    if (config.bufferSize) {
      this.bufferSize = config.bufferSize;
      this.buffer = new Int16Array(this.bufferSize);
    }
    if (config.targetSampleRate) {
      this.targetSampleRate = config.targetSampleRate;
      this.downsampleRatio = this.inputSampleRate / this.targetSampleRate;
    }
    if (config.enablePreEmphasis !== undefined) {
      this.enablePreEmphasis = config.enablePreEmphasis;
    }
    if (config.enableNoiseGate !== undefined) {
      this.enableNoiseGate = config.enableNoiseGate;
    }
    if (config.noiseGateThreshold !== undefined) {
      this.noiseGateThreshold = config.noiseGateThreshold;
    }
  }

  reset() {
    this.buffer.fill(0);
    this.bufferWriteIndex = 0;
    this.downsampleCounter = 0;
    this.previousSample = 0;
    this.processedSamples = 0;
    this.droppedSamples = 0;
  }

  sendStats() {
    const currentTime = currentFrame / sampleRate * 1000;
    this.port.postMessage({
      type: 'stats',
      data: {
        processedSamples: this.processedSamples,
        droppedSamples: this.droppedSamples,
        bufferUtilization: this.bufferWriteIndex / this.bufferSize,
        downsampleRatio: this.downsampleRatio,
        timestamp: currentTime
      }
    });
  }

  sendAndClearBuffer() {
    // Copie du buffer actuel pour éviter les modifications concurrentes
    const dataToSend = this.buffer.slice(0, this.bufferWriteIndex);
    
    this.port.postMessage({
      type: 'audioChunk',
      data: {
        int16arrayBuffer: dataToSend.buffer,
        sampleRate: this.targetSampleRate,
        channels: 1,
        samplesCount: this.bufferWriteIndex,
        timestamp: currentFrame / sampleRate * 1000
      }
    });
    
    this.bufferWriteIndex = 0;
  }

  applyPreEmphasis(sample) {
    if (!this.enablePreEmphasis) return sample;
    
    const output = sample - this.preEmphasisFactor * this.previousSample;
    this.previousSample = sample;
    return output;
  }

  applyNoiseGate(sample) {
    if (!this.enableNoiseGate) return sample;
    
    return Math.abs(sample) < this.noiseGateThreshold ? 0 : sample;
  }

  shouldDownsample() {
    if (!this.enableDownsampling) return true;
    
    this.downsampleCounter++;
    if (this.downsampleCounter >= this.downsampleRatio) {
      this.downsampleCounter = 0;
      return true;
    }
    return false;
  }

  process(inputs) {
    if (inputs[0].length) {
      const inputChannel = inputs[0][0];
      this.processAudioChunk(inputChannel);
    }
    
    // Rapport de stats périodique (toutes les secondes)
    const currentTime = currentFrame / sampleRate * 1000;
    if (currentTime - this.lastStatsReport > 1000) {
      this.sendStats();
      this.lastStatsReport = currentTime;
    }
    
    return true;
  }

  processAudioChunk(float32Array) {
    const length = float32Array.length;
    
    for (let i = 0; i < length; i++) {
      let sample = float32Array[i];
      
      // Application du noise gate
      sample = this.applyNoiseGate(sample);
      
      // Application de la pré-emphase
      sample = this.applyPreEmphasis(sample);
      
      // Downsampling si nécessaire
      if (this.shouldDownsample()) {
        // Conversion Float32 (-1.0 to 1.0) vers Int16 (-32768 to 32767)
        // Avec clamping pour éviter les dépassements
        const int16Value = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
        
        this.buffer[this.bufferWriteIndex++] = int16Value;
        this.processedSamples++;
        
        // Vérification de débordement de buffer
        if (this.bufferWriteIndex >= this.bufferSize) {
          this.sendAndClearBuffer();
        }
      } else {
        this.droppedSamples++;
      }
    }
  }
}

registerProcessor('synapse-audio-processor', SynapseAudioProcessor);
`;

export default SynapseAudioProcessorWorklet;
