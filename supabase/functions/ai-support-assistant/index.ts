import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TicketAnalysis {
  category: string;
  urgency_level: number;
  suggested_response: string;
  confidence_score: number;
  requires_human: boolean;
  estimated_resolution_time: string;
  sentiment_analysis: {
    score: number;
    label: string;
    emotions: Record<string, number>;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ticketId, messageContent, ticketData } = await req.json();
    
    if (!geminiApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Configuration manquante pour l\'IA');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case 'analyze_ticket':
        return await analyzeTicket(supabase, ticketId, ticketData);
      
      case 'generate_response':
        return await generateResponse(supabase, ticketId, messageContent);
      
      case 'escalate_ticket':
        return await escalateTicket(supabase, ticketId);
      
      case 'analyze_sentiment':
        return await analyzeSentiment(supabase, ticketId, messageContent);
        
      default:
        throw new Error('Action non supportée');
    }

  } catch (error) {
    console.error('Erreur AI Support Assistant:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeTicket(supabase: any, ticketId: string, ticketData: any): Promise<Response> {
  // Récupérer toutes les données du ticket
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select(`
      *,
      ticket_messages (*),
      companies (name),
      ticket_categories (name)
    `)
    .eq('id', ticketId)
    .single();

  if (ticketError) throw ticketError;

  const prompt = `
En tant qu'assistant IA expert en support client, analysez ce ticket et fournissez une analyse complète :

**TICKET:**
- Sujet: ${ticket.subject}
- Description: ${ticket.description}
- Priorité actuelle: ${ticket.priority}
- Statut: ${ticket.status}
- Client: ${ticket.companies?.name}
- Catégorie: ${ticket.ticket_categories?.name || 'Non catégorisé'}

**MESSAGES:**
${ticket.ticket_messages?.map((msg: any, idx: number) => 
  `${idx + 1}. [${msg.author_role}] ${msg.author_name}: ${msg.content}`
).join('\n') || 'Aucun message'}

Analysez et retournez UNIQUEMENT un JSON valide avec cette structure exacte :
{
  "category": "technical|billing|account|general",
  "urgency_level": 1-5,
  "suggested_response": "Réponse suggérée détaillée",
  "confidence_score": 0.0-1.0,
  "requires_human": true|false,
  "estimated_resolution_time": "15min|30min|1h|2h|1day|3days",
  "sentiment_analysis": {
    "score": -1.0 à 1.0,
    "label": "very_negative|negative|neutral|positive",
    "emotions": {
      "frustration": 0.0-1.0,
      "urgency": 0.0-1.0,
      "satisfaction": 0.0-1.0,
      "confusion": 0.0-1.0
    }
  }
}
`;

  const response = await callGemini(prompt);
  const analysis: TicketAnalysis = JSON.parse(response);

  // Stocker l'analyse des sentiments
  if (analysis.sentiment_analysis) {
    await supabase
      .from('ticket_sentiment_analysis')
      .insert({
        ticket_id: ticketId,
        message_id: ticket.ticket_messages?.[ticket.ticket_messages.length - 1]?.id,
        sentiment_score: analysis.sentiment_analysis.score,
        sentiment_label: analysis.sentiment_analysis.label,
        emotions: analysis.sentiment_analysis.emotions,
        urgency_level: analysis.urgency_level,
        confidence_score: analysis.confidence_score
      });
  }

  // Mettre à jour le ticket avec l'analyse IA
  await supabase
    .from('tickets')
    .update({
      ai_confidence_score: analysis.confidence_score,
      auto_categorized: true,
      resolution_suggestions: analysis,
      estimated_resolution_time: analysis.estimated_resolution_time
    })
    .eq('id', ticketId);

  // Générer une réponse automatique si approprié  
  if (!analysis.requires_human && analysis.confidence_score > 0.7) {
    await supabase
      .from('ai_support_responses')
      .insert({
        ticket_id: ticketId,
        response_type: 'automated_solution',
        content: analysis.suggested_response,
        confidence_score: analysis.confidence_score,
        metadata: { analysis }
      });
  }

  return new Response(JSON.stringify({
    success: true,
    analysis
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generateResponse(supabase: any, ticketId: string, context: string): Promise<Response> {
  const { data: ticket } = await supabase
    .from('tickets')
    .select(`
      *,
      companies (name),
      ticket_messages (*)
    `)
    .eq('id', ticketId)
    .single();

  const conversationHistory = ticket.ticket_messages
    ?.map((msg: any) => `[${msg.author_role}] ${msg.author_name}: ${msg.content}`)
    .join('\n') || '';

  const prompt = `
En tant qu'assistant support expert et empathique, générez une réponse personnalisée pour ce client :

**CONTEXTE DU TICKET:**
- Sujet: ${ticket.subject}
- Client: ${ticket.companies?.name}
- Priorité: ${ticket.priority}

**HISTORIQUE:**
${conversationHistory}

**DERNIÈRE DEMANDE:**
${context}

Générez une réponse qui :
1. Montre de l'empathie et de la compréhension
2. Propose des solutions concrètes
3. Est professionnelle mais chaleureuse
4. Demande confirmation si nécessaire

Répondez uniquement avec le texte de la réponse, sans formatage JSON.
`;

  const response = await callGemini(prompt);

  // Stocker la réponse générée
  await supabase
    .from('ai_support_responses')
    .insert({
      ticket_id: ticketId,
      response_type: 'automated_solution',
      content: response,
      confidence_score: 0.85,
      metadata: { context, generated_at: new Date().toISOString() }
    });

  return new Response(JSON.stringify({
    success: true,
    response: response.trim()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function escalateTicket(supabase: any, ticketId: string): Promise<Response> {
  // Mettre à jour le ticket
  await supabase
    .from('tickets')
    .update({
      priority: 'urgent',
      escalation_reason: 'Escaladé automatiquement par l\'IA en raison de la complexité ou du sentiment négatif'
    })
    .eq('id', ticketId);

  // Créer une notification d'escalade
  await supabase
    .from('support_notifications')
    .insert({
      ticket_id: ticketId,
      notification_type: 'urgent_escalation',
      title: 'Ticket escaladé automatiquement',
      message: 'Un ticket a été escaladé automatiquement par l\'IA et nécessite une attention immédiate.',
      recipient_role: 'manager',
      severity: 'high'
    });

  return new Response(JSON.stringify({
    success: true,
    message: 'Ticket escaladé avec succès'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function analyzeSentiment(supabase: any, ticketId: string, messageContent: string): Promise<Response> {
  const prompt = `
Analysez le sentiment de ce message de support client et retournez UNIQUEMENT un JSON valide :

"${messageContent}"

Format de réponse :
{
  "sentiment_score": -1.0 à 1.0,
  "sentiment_label": "very_negative|negative|neutral|positive",
  "emotions": {
    "anger": 0.0-1.0,
    "frustration": 0.0-1.0,
    "satisfaction": 0.0-1.0,
    "confusion": 0.0-1.0,
    "urgency": 0.0-1.0
  },
  "urgency_indicators": ["mot1", "mot2"],
  "confidence": 0.0-1.0
}
`;

  const response = await callGemini(prompt);
  const sentimentData = JSON.parse(response);

  // Calculer le niveau d'urgence
  const urgencyLevel = Math.min(5, Math.max(1, 
    Math.round(3 + (sentimentData.sentiment_score * -2) + (sentimentData.emotions.urgency || 0))
  ));

  // Récupérer le dernier message pour l'ID
  const { data: lastMessage } = await supabase
    .from('ticket_messages')
    .select('id')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Stocker l'analyse
  await supabase
    .from('ticket_sentiment_analysis')
    .insert({
      ticket_id: ticketId,
      message_id: lastMessage?.id,
      sentiment_score: sentimentData.sentiment_score,
      sentiment_label: sentimentData.sentiment_label,
      emotions: sentimentData.emotions,
      urgency_level: urgencyLevel,
      confidence_score: sentimentData.confidence
    });

  return new Response(JSON.stringify({
    success: true,
    sentiment: sentimentData,
    urgency_level: urgencyLevel
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + geminiApiKey,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Erreur API Gemini: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}