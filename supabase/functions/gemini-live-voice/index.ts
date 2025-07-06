
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  let geminiWs: WebSocket | null = null;

  socket.onopen = () => {
    console.log("Client connected to Gemini Live");
    
    // Établir la connexion WebSocket avec Gemini
    const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${geminiApiKey}`;
    
    geminiWs = new WebSocket(geminiUrl);
    
    geminiWs.onopen = () => {
      console.log("Connected to Gemini Live API");
      
      // Configuration initiale pour Gemini Live
      const setupMessage = {
        setup: {
          model: "models/gemini-2.0-flash-exp",
          generation_config: {
            response_modalities: ["AUDIO"],
            speech_config: {
              voice_config: {
                prebuilt_voice_config: {
                  voice_name: "Charon"
                }
              }
            }
          },
          system_instruction: {
            parts: [
              {
                text: `Tu es Synapse, l'assistant IA vocal intelligent d'Arcadis Technologies. 
                Tu parles français de manière naturelle et conversationnelle.
                Tu es capable d'analyser les données de l'entreprise en temps réel.
                Garde tes réponses concises et utiles.
                Tu peux aider avec la gestion de projets, RH, business et analytics.`
              }
            ]
          }
        }
      };
      
      geminiWs.send(JSON.stringify(setupMessage));
    };

    geminiWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Message from Gemini:", data);
        
        // Transférer la réponse au client
        socket.send(event.data);
      } catch (error) {
        console.error("Error parsing Gemini response:", error);
      }
    };

    geminiWs.onerror = (error) => {
      console.error("Gemini WebSocket error:", error);
      socket.send(JSON.stringify({ 
        error: "Erreur de connexion avec Gemini Live" 
      }));
    };

    geminiWs.onclose = () => {
      console.log("Gemini WebSocket closed");
    };
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log("Message from client:", message);
      
      // Transférer le message au service Gemini
      if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
        geminiWs.send(event.data);
      } else {
        socket.send(JSON.stringify({ 
          error: "Connexion Gemini non disponible" 
        }));
      }
    } catch (error) {
      console.error("Error handling client message:", error);
    }
  };

  socket.onclose = () => {
    console.log("Client disconnected from Gemini Live");
    if (geminiWs) {
      geminiWs.close();
    }
  };

  socket.onerror = (error) => {
    console.error("Client WebSocket error:", error);
  };

  return response;
});
