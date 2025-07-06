/**
 * Polyfills pour la compatibilité de build sur différentes plateformes
 * Résout les problèmes de déploiement Lovable et autres environnements
 */

/**
 * Polyfill sécurisé pour crypto.randomUUID
 * Compatible avec les environnements sans crypto natif
 */
export const safeRandomUUID = (): string => {
  // Vérifier la disponibilité native
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback compatible avec tous les environnements
  return 'xxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Vérifier la disponibilité des AudioWorklets
 * Évite les erreurs en build SSR
 */
export const isAudioWorkletSupported = (): boolean => {
  try {
    return typeof AudioWorkletNode !== 'undefined' && 
           typeof window !== 'undefined' && 
           !!window.AudioContext &&
           typeof window.AudioContext === 'function';
  } catch (error) {
    console.warn('AudioWorklet check failed:', error);
    return false;
  }
};

/**
 * Vérifier la disponibilité de l'API WebRTC
 */
export const isWebRTCSupported = (): boolean => {
  try {
    return typeof RTCPeerConnection !== 'undefined' &&
           typeof navigator !== 'undefined' &&
           !!navigator.mediaDevices &&
           !!navigator.mediaDevices.getUserMedia;
  } catch (error) {
    console.warn('WebRTC check failed:', error);
    return false;
  }
};

/**
 * Polyfill pour import.meta.env dans différents environnements
 */
export const getEnvVar = (key: string, fallback: string = ''): string => {
  try {
    // Vite environment
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key] || fallback;
    }
    
    // Node.js environment
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || fallback;
    }
    
    // Browser environment with global config
    if (typeof window !== 'undefined' && (window as any).__ENV__) {
      return (window as any).__ENV__[key] || fallback;
    }
    
    return fallback;
  } catch (error) {
    console.warn(`Failed to get environment variable ${key}:`, error);
    return fallback;
  }
};

/**
 * Vérification sécurisée de la disponibilité du DOM
 */
export const isDOMAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof document !== 'undefined' &&
         !!document.createElement;
};

/**
 * Wrapper sécurisé pour les opérations DOM
 */
export const safeDOMOperation = <T>(operation: () => T, fallback: T): T => {
  try {
    if (!isDOMAvailable()) {
      return fallback;
    }
    return operation();
  } catch (error) {
    console.warn('DOM operation failed:', error);
    return fallback;
  }
};

/**
 * Logger compatible avec tous les environnements
 */
export const safeLog = {
  info: (message: string, ...args: any[]) => {
    if (typeof console !== 'undefined' && console.info) {
      console.info(`[Synapse] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(`[Synapse] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (typeof console !== 'undefined' && console.error) {
      console.error(`[Synapse] ${message}`, ...args);
    }
  },
  debug: (message: string, ...args: any[]) => {
    if (typeof console !== 'undefined' && console.debug && getEnvVar('NODE_ENV') === 'development') {
      console.debug(`[Synapse] ${message}`, ...args);
    }
  }
};
