/**
 * Worklet de mesure de volume pour Synapse Voice Assistant
 * Inspiré de l'implémentation Google Gemini Live API
 * Optimisé pour la détection d'activité vocale en temps réel
 */

const SynapseVolumeMeterWorklet = `
class SynapseVolumeMeter extends AudioWorkletProcessor {
  constructor() {
    super();
    this.volume = 0;
    this.updateIntervalInMS = 25; // 25ms pour un feedback fluide
    this.nextUpdateFrame = this.updateIntervalInMS;
    this.noiseThreshold = 0.01; // Seuil de bruit de fond
    this.speechThreshold = 0.05; // Seuil de détection de parole
    this.isSpeaking = false;
    this.speakingStartTime = 0;
    this.speakingEndTime = 0;
    this.silenceBuffer = 300; // 300ms de silence pour arrêter
    
    this.port.onmessage = event => {
      if (event.data.updateIntervalInMS) {
        this.updateIntervalInMS = event.data.updateIntervalInMS;
      }
      if (event.data.speechThreshold) {
        this.speechThreshold = event.data.speechThreshold;
      }
      if (event.data.noiseThreshold) {
        this.noiseThreshold = event.data.noiseThreshold;
      }
    };
  }

  get intervalInFrames() {
    return (this.updateIntervalInMS / 1000) * sampleRate;
  }

  process(inputs) {
    const input = inputs[0];
    if (input.length > 0) {
      const samples = input[0];
      let sum = 0;
      let rms = 0;

      // Calcul RMS (Root Mean Square) pour mesurer le volume
      for (let i = 0; i < samples.length; ++i) {
        sum += samples[i] * samples[i];
      }
      rms = Math.sqrt(sum / samples.length);

      // Lissage du volume avec decay
      this.volume = Math.max(rms, this.volume * 0.85);

      // Détection d'activité vocale
      const currentTime = currentFrame / sampleRate * 1000; // temps en ms
      const wasSpeaking = this.isSpeaking;

      if (rms > this.speechThreshold) {
        if (!this.isSpeaking) {
          this.isSpeaking = true;
          this.speakingStartTime = currentTime;
        }
        this.speakingEndTime = currentTime;
      } else if (this.isSpeaking && (currentTime - this.speakingEndTime) > this.silenceBuffer) {
        this.isSpeaking = false;
      }

      // Mise à jour des frames
      this.nextUpdateFrame -= samples.length;
      if (this.nextUpdateFrame < 0) {
        this.nextUpdateFrame += this.intervalInFrames;
        
        // Émission des données de volume et d'activité vocale
        this.port.postMessage({
          type: 'volume',
          data: {
            volume: this.volume,
            rms: rms,
            isSpeaking: this.isSpeaking,
            speakingDuration: this.isSpeaking ? currentTime - this.speakingStartTime : 0,
            timestamp: currentTime,
            isNoise: rms > this.noiseThreshold && rms < this.speechThreshold
          }
        });

        // Émission d'événements de changement d'état de parole
        if (wasSpeaking !== this.isSpeaking) {
          this.port.postMessage({
            type: 'speechStateChange',
            data: {
              isSpeaking: this.isSpeaking,
              timestamp: currentTime,
              duration: this.isSpeaking ? 0 : currentTime - this.speakingStartTime
            }
          });
        }
      }
    }
    return true;
  }
}

registerProcessor('synapse-volume-meter', SynapseVolumeMeter);
`;

export default SynapseVolumeMeterWorklet;
