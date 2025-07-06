
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Bot,
  Loader2,
  Zap,
  Brain
} from 'lucide-react';

export const GeminiLiveInterface: React.FC = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const connectToSynapseLive = async () => {
    try {
      setConnectionStatus('connecting');
      
      // Se connecter au WebSocket Supabase qui fait le relais vers Synapse
      const wsUrl = `wss://qlqgyrfqiflnqknbtycw.functions.supabase.co/synapse-live-voice`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Connecté à Synapse IA');
        setIsConnected(true);
        setConnectionStatus('connected');
        toast({
          title: "🧠 Synapse IA activé",
          description: "Conversation vocale en temps réel active"
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Message de Synapse:', data);
          
          // Traiter les réponses audio de Synapse
          if (data.candidates && data.candidates[0]?.content?.parts) {
            const parts = data.candidates[0].content.parts;
            for (const part of parts) {
              if (part.inline_data && part.inline_data.mime_type === 'audio/pcm') {
                // Jouer l'audio reçu
                playAudioFromBase64(part.inline_data.data);
              }
            }
          }
        } catch (error) {
          console.error('Erreur traitement message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        setConnectionStatus('error');
        toast({
          variant: "destructive",
          title: "Erreur de connexion",
          description: "Impossible de se connecter à Synapse IA"
        });
      };

      wsRef.current.onclose = () => {
        console.log('Connexion fermée');
        setIsConnected(false);
        setConnectionStatus('disconnected');
      };

    } catch (error) {
      console.error('Erreur connexion:', error);
      setConnectionStatus('error');
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
