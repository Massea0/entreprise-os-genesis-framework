
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const { transcript, language, currentModule, userId, context } = await req.json();

    if (!transcript) {
      return new Response(
        JSON.stringify({ error: 'Transcript requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier si c'est une commande Synapse
    const cleanTranscript = transcript.toLowerCase().trim();
    const isSynapseCommand = cleanTranscript.startsWith('synapse') || 
                           cleanTranscript.includes('synapse');

    if (!isSynapseCommand) {
      return new Response(
        JSON.stringify({ 
          response: language === 'fr' 
            ? "Dites 'Synapse' suivi de votre question pour m'activer."
            : "Say 'Synapse' followed by your question to activate me."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extraire la vraie commande après "Synapse"
    const command = cleanTranscript.replace(/^.*synapse\s*/i, '').trim();

    // Récupérer les données contextuelles de l'entreprise
    const [projectsData, employeesData, companiesData, tasksData] = await Promise.all([
      supabase.from('projects').select('*').limit(50),
      supabase.from('employees').select('*').limit(100),
      supabase.from('companies').select('*').limit(20),
      supabase.from('tasks').select('*').limit(100)
    ]);

    const contextData = {
      projects: projectsData.data || [],
      employees: employeesData.data || [],
      companies: companiesData.data || [],
      tasks: tasksData.data || [],
      currentModule,
      userLanguage: language
    };

    // Construire le prompt pour Gemini
    const systemPrompt = `
Tu es Synapse, l'assistant IA vocal intelligent d'Arcadis Technologies. Tu parles ${language === 'fr' ? 'français' : 'anglais'}.

DONNÉES CONTEXTUELLES ENTREPRISE:
- Projets actifs: ${contextData.projects.length}
- Employés: ${contextData.employees.length}  
- Clients: ${contextData.companies.length}
- Tâches: ${contextData.tasks.length}

CAPACITÉS:
1. Navigation vocale dans l'application
2. Analyse de données RH, projets, finances
3. Génération d'insights et recommandations
4. Réponses en temps réel

DONNÉES DISPONIBLES:
${JSON.stringify(contextData, null, 2)}

INSTRUCTIONS:
- Réponds de manière conversationnelle et naturelle
- Sois concis mais informatif
- Utilise les données réelles pour tes réponses
- Si tu ne peux pas faire quelque chose, explique pourquoi
- Reste dans le contexte professionnel d'Arcadis Technologies

COMMANDE UTILISATEUR: "${command}"
`;

    // Appel à Gemini
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + geminiApiKey,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: systemPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur API Gemini: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;

    // Log de l'interaction
    await supabase.from('ai_tasks_log').insert({
      task_type: 'voice_assistant',
      status: 'completed',
      input_data: { transcript, command, language, currentModule },
      output_data: { response: aiResponse, contextUsed: true }
    });

    // Générer un insight si pertinent
    let insight = null;
    if (command.includes('projet') || command.includes('project') || 
        command.includes('équipe') || command.includes('team') ||
        command.includes('analyse') || command.includes('analysis')) {
      insight = {
        type: 'voice_query',
        module: currentModule,
        query: command,
        timestamp: new Date().toISOString(),
        language
      };
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        insight,
        processed: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur voice-ai-assistant:', error);
    
    return new Response(
      JSON.stringify({
        response: language === 'fr' 
          ? "Désolé, je rencontre un problème technique. Veuillez réessayer."
          : "Sorry, I'm experiencing a technical issue. Please try again.",
        error: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
