
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Bot, 
  Loader2,
  Languages,
  Settings,
  Play,
  Pause
} from 'lucide-react';

interface VoiceInterfaceProps {
  onInsight?: (insight: any) => void;
  currentModule?: string;
  userId?: string;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  onInsight,
  currentModule = 'dashboard',
  userId
}) => {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [volume, setVolume] = useState(0.8);
  const [isEnabled, setIsEnabled] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialisation des API vocales
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === 'fr' ? 'fr-FR' : 'en-US';
      
      recognitionRef.current.onresult = handleSpeechResult;
      recognitionRef.current.onerror = handleSpeechError;
      recognitionRef.current.onend = () => {
        if (isListening) {
          startListening(); // Redémarrer automatiquement
        }
      };
    }

    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }

    // Initialiser AudioContext pour l'analyse audio
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

    return () => {
      stopListening();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [language]);

  const handleSpeechResult = async (event: SpeechRecognitionEvent) => {
    const transcript = Array.from(event.results)
      .map(result => result[0].transcript)
      .join('');

    if (event.results[event.results.length - 1].isFinal) {
      setIsProcessing(true);
      
      try {
        // Envoyer à l'IA pour traitement
        const { data, error } = await supabase.functions.invoke('voice-ai-assistant', {
          body: {
            transcript,
            language,
            currentModule,
            userId,
            context: {
              timestamp: new Date().toISOString(),
              sessionId: `voice_${Date.now()}`
            }
          }
        });

        if (error) throw error;

        if (data?.response) {
          await speakResponse(data.response, language);
          
          // Si c'est un insight, le transmettre
          if (data.insight) {
            onInsight?.(data.insight);
          }
        }
      } catch (error) {
        console.error('Erreur traitement vocal:', error);
        await speakResponse(
          language === 'fr' 
            ? "Désolé, je n'ai pas pu traiter votre demande."
            : "Sorry, I couldn't process your request.",
          language
        );
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSpeechError = (event: SpeechRecognitionErrorEvent) => {
    console.error('Erreur reconnaissance vocale:', event.error);
    setIsListening(false);
    
    if (event.error === 'not-allowed') {
      toast({
        variant: "destructive",
        title: "Microphone requis",
        description: "Veuillez autoriser l'accès au microphone pour utiliser l'assistant vocal"
      });
    }
  };

  const speakResponse = async (text: string, lang: 'fr' | 'en') => {
    if (!synthesisRef.current) return;

    setIsSpeaking(true);
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
    utterance.volume = volume;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Sélectionner une voix appropriée
    const voices = synthesisRef.current.getVoices();
    const voice = voices.find(v => 
      v.lang.startsWith(lang === 'fr' ? 'fr' : 'en') && 
      (v.name.includes('Google') || v.name.includes('Microsoft'))
    ) || voices.find(v => v.lang.startsWith(lang === 'fr' ? 'fr' : 'en'));
    
    if (voice) utterance.voice = voice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesisRef.current.speak(utterance);
  };

  const startListening = async () => {
    if (!recognitionRef.current) {
      toast({
        variant: "destructive",
        title: "Non supporté",
        description: "La reconnaissance vocale n'est pas supportée sur ce navigateur"
      });
      return;
    }

    try {
      // Demander permission microphone
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      recognitionRef.current.start();
      setIsListening(true);
      setIsEnabled(true);
      
      toast({
        title: "🎤 Assistant vocal activé",
        description: language === 'fr' 
          ? "Dites 'Arcadis' suivi de votre question"
          : "Say 'Arcadis' followed by your question"
      });
    } catch (error) {
      console.error('Erreur démarrage écoute:', error);
      toast({
        variant: "destructive",
        title: "Erreur microphone",
        description: "Impossible d'accéder au microphone"
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleLanguage = () => {
    const newLang = language === 'fr' ? 'en' : 'fr';
    setLanguage(newLang);
    
    if (recognitionRef.current) {
      recognitionRef.current.lang = newLang === 'fr' ? 'fr-FR' : 'en-US';
    }
    
    toast({
      title: newLang === 'fr' ? "🇫🇷 Français activé" : "🇺🇸 English activated",
      description: newLang === 'fr' 
        ? "L'assistant parle maintenant en français"
        : "Assistant now speaks in English"
    });
  };

  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-80 shadow-2xl border-primary/20 bg-white/95 backdrop-blur-sm">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-semibold">Assistant Vocal IA</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="h-8 w-8 p-0"
              >
                <Languages className="h-4 w-4" />
              </Button>
              <Badge variant={language === 'fr' ? 'default' : 'secondary'}>
                {language === 'fr' ? '🇫🇷' : '🇺🇸'}
              </Badge>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center mb-4">
            {isProcessing ? (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Traitement IA...</span>
              </div>
            ) : isListening ? (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm">À l'écoute...</span>
              </div>
            ) : isSpeaking ? (
              <div className="flex items-center gap-2 text-purple-600">
                <Volume2 className="h-4 w-4" />
                <span className="text-sm">Assistant parle...</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">
                {language === 'fr' ? 'Prêt à vous aider' : 'Ready to help'}
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {!isListening ? (
              <Button 
                onClick={startListening} 
                className="flex-1"
                disabled={isProcessing}
              >
                <Mic className="h-4 w-4 mr-2" />
                {language === 'fr' ? 'Activer' : 'Activate'}
              </Button>
            ) : (
              <Button 
                onClick={stopListening} 
                variant="destructive" 
                className="flex-1"
              >
                <MicOff className="h-4 w-4 mr-2" />
                {language === 'fr' ? 'Arrêter' : 'Stop'}
              </Button>
            )}

            {isSpeaking && (
              <Button onClick={stopSpeaking} variant="outline" size="sm">
                <Pause className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-3 p-2 bg-muted/50 rounded text-xs text-center">
            {language === 'fr' ? (
              <>Dites <strong>"Arcadis"</strong> puis votre question</>
            ) : (
              <>Say <strong>"Arcadis"</strong> then your question</>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
