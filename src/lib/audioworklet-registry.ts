/**
 * Registre des AudioWorklets pour Synapse Voice Assistant
 * Inspiré de l'implémentation Google Gemini Live API
 * Gestion centralisée des worklets audio
 */

// Registre global des worklets par contexte audio
export const registeredWorklets = new WeakMap<AudioContext, WorkletRegistry>();

export interface WorkletRegistry {
  [workletName: string]: {
    node?: AudioWorkletNode;
    handlers: Array<(event: MessageEvent) => void>;
    isLoaded?: boolean;
  };
}

export interface WorkletEventData {
  type: string;
  data: any;
  timestamp?: number;
}

/**
 * Crée un blob URL à partir du code source d'un worklet
 * @param workletName Nom du worklet
 * @param workletSrc Code source du worklet
 * @returns URL du blob pour le worklet
 */
export function createWorketFromSrc(workletName: string, workletSrc: string): string {
  const blob = new Blob([workletSrc], { type: 'application/javascript' });
  return URL.createObjectURL(blob);
}

/**
 * Enregistre un worklet sur un contexte audio
 * @param context Contexte audio
 * @param workletName Nom du worklet
 * @param workletSrc Code source du worklet
 * @param handler Gestionnaire d'événements
 * @returns Promise qui se résout quand le worklet est prêt
 */
export async function registerWorklet<T extends (event: MessageEvent) => void>(
  context: AudioContext,
  workletName: string,
  workletSrc: string,
  handler: T
): Promise<AudioWorkletNode> {
  let workletsRecord = registeredWorklets.get(context);
  
  if (workletsRecord && workletsRecord[workletName]) {
    // Le worklet existe déjà, ajouter le handler
    if (workletsRecord[workletName].node) {
      workletsRecord[workletName].handlers.push(handler);
      const node = workletsRecord[workletName].node!;
      node.port.onmessage = createMultiHandler(workletsRecord[workletName].handlers);
      return node;
    }
  }

  if (!workletsRecord) {
    registeredWorklets.set(context, {});
    workletsRecord = registeredWorklets.get(context)!;
  }

  // Créer un nouvel enregistrement
  workletsRecord[workletName] = { 
    handlers: [handler],
    isLoaded: false
  };

  try {
    // Créer le blob URL et charger le worklet
    const blobUrl = createWorketFromSrc(workletName, workletSrc);
    await context.audioWorklet.addModule(blobUrl);
    
    // Créer le nœud worklet
    const workletNode = new AudioWorkletNode(context, workletName);
    
    // Configurer le gestionnaire de messages
    workletNode.port.onmessage = createMultiHandler(workletsRecord[workletName].handlers);
    
    // Enregistrer le nœud
    workletsRecord[workletName].node = workletNode;
    workletsRecord[workletName].isLoaded = true;
    
    // Nettoyer l'URL du blob
    URL.revokeObjectURL(blobUrl);
    
    return workletNode;
  } catch (error) {
    console.error(`Erreur lors de l'enregistrement du worklet ${workletName}:`, error);
    // Nettoyer l'enregistrement en cas d'erreur
    delete workletsRecord[workletName];
    throw error;
  }
}

/**
 * Crée un gestionnaire qui peut router les messages vers plusieurs handlers
 * @param handlers Liste des gestionnaires d'événements
 * @returns Gestionnaire unifié
 */
function createMultiHandler(handlers: Array<(event: MessageEvent) => void>) {
  return (event: MessageEvent) => {
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Erreur dans le gestionnaire de worklet:', error);
      }
    });
  };
}

/**
 * Obtient un worklet existant
 * @param context Contexte audio
 * @param workletName Nom du worklet
 * @returns Le nœud worklet ou null s'il n'existe pas
 */
export function getWorklet(context: AudioContext, workletName: string): AudioWorkletNode | null {
  const workletsRecord = registeredWorklets.get(context);
  return workletsRecord?.[workletName]?.node || null;
}

/**
 * Vérifie si un worklet est chargé
 * @param context Contexte audio
 * @param workletName Nom du worklet
 * @returns true si le worklet est chargé
 */
export function isWorkletLoaded(context: AudioContext, workletName: string): boolean {
  const workletsRecord = registeredWorklets.get(context);
  return workletsRecord?.[workletName]?.isLoaded || false;
}

/**
 * Désenregistre un worklet
 * @param context Contexte audio
 * @param workletName Nom du worklet
 */
export function unregisterWorklet(context: AudioContext, workletName: string): void {
  const workletsRecord = registeredWorklets.get(context);
  if (workletsRecord && workletsRecord[workletName]) {
    const workletData = workletsRecord[workletName];
    
    // Déconnecter le nœud s'il existe
    if (workletData.node) {
      workletData.node.disconnect();
      workletData.node.port.onmessage = null;
    }
    
    // Supprimer l'enregistrement
    delete workletsRecord[workletName];
  }
}

/**
 * Nettoie tous les worklets d'un contexte
 * @param context Contexte audio à nettoyer
 */
export function cleanupWorklets(context: AudioContext): void {
  const workletsRecord = registeredWorklets.get(context);
  if (workletsRecord) {
    Object.keys(workletsRecord).forEach(workletName => {
      unregisterWorklet(context, workletName);
    });
    registeredWorklets.delete(context);
  }
}

/**
 * Utilitaire pour envoyer un message à un worklet
 * @param context Contexte audio
 * @param workletName Nom du worklet
 * @param message Message à envoyer
 */
export function sendMessageToWorklet(
  context: AudioContext, 
  workletName: string, 
  message: any
): void {
  const workletNode = getWorklet(context, workletName);
  if (workletNode) {
    workletNode.port.postMessage(message);
  } else {
    console.warn(`Worklet ${workletName} non trouvé ou non chargé`);
  }
}

/**
 * Configuration par défaut pour les worklets Synapse
 */
export const SYNAPSE_WORKLET_CONFIGS = {
  volumeMeter: {
    name: 'synapse-volume-meter',
    defaultConfig: {
      updateIntervalInMS: 25,
      speechThreshold: 0.05,
      noiseThreshold: 0.01
    }
  },
  audioProcessor: {
    name: 'synapse-audio-processor',
    defaultConfig: {
      bufferSize: 2048,
      targetSampleRate: 16000,
      enablePreEmphasis: true,
      enableNoiseGate: true,
      noiseGateThreshold: 0.001
    }
  }
} as const;
