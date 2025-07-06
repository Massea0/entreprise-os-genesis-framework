
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
    const isSynapseCommand = cleanTranscript.includes('synapse') || 
                           context?.suggestions?.some((s: any) => 
                             cleanTranscript.includes(s.text.toLowerCase())
                           );

    if (!isSynapseCommand && !cleanTranscript.startsWith('synapse')) {
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

    // Récupérer les données contextuelles selon le module actuel
    const [projectsData, employeesData, companiesData, tasksData, devisData, invoicesData] = await Promise.all([
      supabase.from('projects').select('*').limit(30),
      supabase.from('employees').select('*').limit(50),
      supabase.from('companies').select('*').limit(20),
      supabase.from('tasks').select('*').limit(50),
      supabase.from('devis').select('*').limit(20),
      supabase.from('invoices').select('*').limit(20)
    ]);

    // Déterminer le contexte spécifique selon la page
    let moduleContext = '';
    if (currentModule?.includes('/dashboard')) {
      moduleContext = 'Dashboard - Vue d\'ensemble de l\'entreprise';
    } else if (currentModule?.includes('/projects')) {
      moduleContext = 'Projets - Gestion des projets et tâches';
    } else if (currentModule?.includes('/hr')) {
      moduleContext = 'Ressources Humaines - Gestion des employés';
    } else if (currentModule?.includes('/business')) {
      moduleContext = 'Business - Devis, factures et clients';
    } else {
      moduleContext = 'Navigation générale';
    }

    const contextData = {
      projects: projectsData.data || [],
      employees: employeesData.data || [],
      companies: companiesData.data || [],
      tasks: tasksData.data || [],
      devis: devisData.data || [],
      invoices: invoicesData.data || [],
      currentModule: moduleContext,
      userLanguage: language,
      contextualSuggestions: context?.suggestions || [],
      timestamp: new Date().toISOString()
    };

    // Construire le prompt pour Gemini avec contexte enrichi
    const systemPrompt = `
Tu es Synapse, l'assistant IA vocal intelligent d'Arcadis Technologies. Tu parles ${language === 'fr' ? 'français' : 'anglais'}.

CONTEXTE ACTUEL: ${moduleContext}

DONNÉES TEMPS RÉEL:
- Projets: ${contextData.projects.length} (dont ${contextData.projects.filter(p => p.status === 'in_progress').length} en cours)
- Employés: ${contextData.employees.length} 
- Clients: ${contextData.companies.length}
- Tâches: ${contextData.tasks.length} (dont ${contextData.tasks.filter(t => t.status === 'pending').length} en attente)
- Devis: ${contextData.devis.length} (dont ${contextData.devis.filter(d => d.status === 'pending').length} en attente)
- Factures: ${contextData.invoices.length} (dont ${contextData.invoices.filter(i => i.status === 'pending').length} impayées)

SUGGESTIONS CONTEXTUELLES DISPONIBLES:
${contextData.contextualSuggestions.map((s: any) => `${s.icon} ${s.text}`).join('\n')}

DONNÉES COMPLÈTES:
${JSON.stringify(contextData, null, 2)}

CAPACITÉS SYNAPSE:
1. Navigation contextuelle dans l'application
2. Analyse de données en temps réel avec insights intelligents
3. Recommandations basées sur le contexte actuel
4. Génération de rapports et alertes
5. Assistance proactive selon la page visitée

INSTRUCTIONS:
- Réponds de manière conversationnelle et naturelle
- Utilise les données réelles pour des réponses précises
- Fournis des insights utiles et actionables
- Adapte tes réponses au contexte de la page actuelle
- Sois proactif avec des suggestions pertinentes
- Reste dans le contexte professionnel d'Arcadis Technologies

COMMANDE UTILISATEUR: "${command}"
CONTEXTE: ${moduleContext}
`;

    // Appel à Gemini avec prompt enrichi
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

    // Log de l'interaction avec contexte enrichi
    await supabase.from('ai_tasks_log').insert({
      task_type: 'voice_assistant_contextual',
      status: 'completed',
      input_data: { 
        transcript, 
        command, 
        language, 
        currentModule,
        contextualSuggestions: context?.suggestions 
      },
      output_data: { 
        response: aiResponse, 
        contextUsed: true,
        moduleContext,
        dataStats: {
          projects: contextData.projects.length,
          employees: contextData.employees.length,
          companies: contextData.companies.length,
          tasks: contextData.tasks.length
        }
      }
    });

    // Générer un insight contextuel si pertinent
    let insight = null;
    if (command.length > 0) {
      insight = {
        type: 'contextual_voice_query',
        module: moduleContext,
        query: command,
        timestamp: new Date().toISOString(),
        language,
        suggestionsProvided: context?.suggestions?.length || 0
      };
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        insight,
        processed: true,
        context: moduleContext
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur voice-ai-assistant:', error);
    
    const { language } = await req.json().catch(() => ({ language: 'fr' }));
    
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
