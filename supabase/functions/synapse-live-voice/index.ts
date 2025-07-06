import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400, headers: corsHeaders });
  }

  try {
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    console.log("Synapse Live Voice WebSocket connection established");

    socket.onopen = () => {
      console.log("WebSocket opened");
      socket.send(JSON.stringify({
        type: 'connection_established',
        message: 'Synapse IA connecté',
        timestamp: new Date().toISOString()
      }));
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);

        switch (data.type) {
          case 'voice_input':
            // Traitement de l'entrée vocale
            socket.send(JSON.stringify({
              type: 'voice_response',
              message: 'Message vocal reçu et traité par Synapse IA',
              timestamp: new Date().toISOString()
            }));
            break;

          case 'text_input':
            // Traitement de l'entrée texte
            socket.send(JSON.stringify({
              type: 'text_response',
              message: `Synapse IA répond: ${data.message}`,
              timestamp: new Date().toISOString()
            }));
            break;

          case 'ping':
            socket.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString()
            }));
            break;

          default:
            socket.send(JSON.stringify({
              type: 'error',
              message: 'Type de message non reconnu',
              timestamp: new Date().toISOString()
            }));
        }
      } catch (error) {
        console.error("Error processing message:", error);
        socket.send(JSON.stringify({
          type: 'error',
          message: 'Erreur de traitement du message',
          timestamp: new Date().toISOString()
        }));
      }
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return response;

  } catch (error) {
    console.error("Error creating WebSocket:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});