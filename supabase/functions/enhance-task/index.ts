import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskId, action } = await req.json();
    
    if (!geminiApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Configuration manquante');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer les détails de la tâche
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        *,
        projects(name, description),
        users:assignee_id(first_name, last_name)
      `)
      .eq('id', taskId)
      .single();

    if (taskError) throw taskError;

    let result;
    switch (action) {
      case 'enhance_description':
        result = await enhanceDescription(task);
        break;
      case 'suggest_subtasks':
        result = await suggestSubtasks(task);
        break;
      case 'estimate_effort':
        result = await estimateEffort(task);
        break;
      case 'suggest_acceptance_criteria':
        result = await suggestAcceptanceCriteria(task);
        break;
      default:
        throw new Error('Action non supportée');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erreur enhance-task:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function callGemini(prompt: string) {
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
          temperature: 0.7,
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

async function enhanceDescription(task: any) {
  const prompt = `
En tant qu'expert en gestion de projet, améliore cette description de tâche pour qu'elle soit plus claire, détaillée et actionnable:

Titre: ${task.title}
Description actuelle: ${task.description || 'Aucune description'}
Projet: ${task.projects?.name}
Priorité: ${task.priority}
Status: ${task.status}

Fournis une description améliorée qui inclut:
1. Un objectif clair
2. Le contexte nécessaire  
3. Les étapes principales
4. Les livrables attendus

Garde un ton professionnel et concis. Limite à 300 mots maximum.
`;

  const enhancement = await callGemini(prompt);
  return { type: 'enhanced_description', content: enhancement };
}

async function suggestSubtasks(task: any) {
  const prompt = `
Décompose cette tâche principale en sous-tâches spécifiques et actionnables:

Titre: ${task.title}
Description: ${task.description || 'Aucune description'}
Priorité: ${task.priority}

Propose 3-6 sous-tâches au format JSON:
{
  "subtasks": [
    {
      "title": "Titre de la sous-tâche",
      "description": "Description courte",
      "estimated_hours": 2,
      "priority": "medium"
    }
  ]
}

Assure-toi que les sous-tâches couvrent tous les aspects de la tâche principale.
`;

  const response = await callGemini(prompt);
  try {
    // Extraire le JSON de la réponse
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const subtasks = jsonMatch ? JSON.parse(jsonMatch[0]) : { subtasks: [] };
    return { type: 'suggested_subtasks', content: subtasks };
  } catch {
    return { type: 'suggested_subtasks', content: { subtasks: [] } };
  }
}

async function estimateEffort(task: any) {
  const prompt = `
Estime l'effort nécessaire pour réaliser cette tâche:

Titre: ${task.title}
Description: ${task.description || 'Aucune description'}
Priorité: ${task.priority}
Heures estimées actuelles: ${task.estimated_hours || 'Non défini'}

Fournis une estimation détaillée au format JSON:
{
  "estimated_hours": 8,
  "confidence": "high",
  "breakdown": {
    "analysis": 2,
    "development": 4,
    "testing": 1,
    "review": 1
  },
  "assumptions": ["Hypothèse 1", "Hypothèse 2"],
  "risks": ["Risque 1"]
}

Base ton estimation sur les standards de l'industrie.
`;

  const response = await callGemini(prompt);
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const estimation = jsonMatch ? JSON.parse(jsonMatch[0]) : { estimated_hours: task.estimated_hours || 4 };
    return { type: 'effort_estimation', content: estimation };
  } catch {
    return { type: 'effort_estimation', content: { estimated_hours: task.estimated_hours || 4 } };
  }
}

async function suggestAcceptanceCriteria(task: any) {
  const prompt = `
Définis des critères d'acceptation clairs pour cette tâche:

Titre: ${task.title}
Description: ${task.description || 'Aucune description'}
Priorité: ${task.priority}

Propose des critères d'acceptation au format "Given-When-Then" ou sous forme de liste vérifiable:

Format souhaité:
- [ ] Critère 1 spécifique et mesurable
- [ ] Critère 2 testable
- [ ] Critère 3 orienté utilisateur

Fournis 3-7 critères concrets et vérifiables.
`;

  const criteria = await callGemini(prompt);
  return { type: 'acceptance_criteria', content: criteria };
}