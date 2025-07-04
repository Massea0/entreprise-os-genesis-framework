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

interface AIProjectPlanSuggestion {
  phases: {
    name: string;
    description: string;
    estimatedDuration: number;
    tasks: {
      title: string;
      description: string;
      estimatedHours: number;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      requiredSkills?: string[];
    }[];
  }[];
  totalEstimatedDuration: number;
  estimatedBudget?: number;
  recommendations: string[];
  arcadisLevel: 'START' | 'PRO' | 'EXPERT';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const { name, description, budget, clientType, industry } = await req.json();

    if (!name || !description) {
      return new Response(
        JSON.stringify({ error: 'Nom et description du projet requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Détecter le niveau Arcadis basé sur le budget et la complexité
    const detectArcadisLevel = (budget: number, description: string): 'START' | 'PRO' | 'EXPERT' => {
      const complexityIndicators = [
        'intégration', 'api', 'microservices', 'scalabilité', 'haute disponibilité',
        'machine learning', 'ia', 'big data', 'blockchain', 'cloud native'
      ];
      
      const hasComplexity = complexityIndicators.some(indicator => 
        description.toLowerCase().includes(indicator)
      );

      if (budget > 10000000 || hasComplexity) return 'EXPERT'; // 10M+ XOF
      if (budget > 2000000) return 'PRO'; // 2M+ XOF
      return 'START';
    };

    const arcadisLevel = detectArcadisLevel(budget || 0, description);

    // Générer le plan avec l'IA Gemini
    const aiPrompt = `
En tant qu'expert en gestion de projet chez Arcadis Technologies, génère un plan détaillé pour ce projet :

**PROJET:** ${name}
**DESCRIPTION:** ${description}
**BUDGET:** ${budget ? `${budget.toLocaleString()} XOF` : 'Non spécifié'}
**NIVEAU ARCADIS:** ${arcadisLevel}
**TYPE CLIENT:** ${clientType || 'Standard'}
**SECTEUR:** ${industry || 'Général'}

Génère un plan structuré avec :

1. **PHASES DU PROJET** (3-5 phases logiques)
   - Nom de la phase
   - Description détaillée
   - Durée estimée en jours
   - Tâches spécifiques avec :
     - Titre de la tâche
     - Description détaillée
     - Heures estimées
     - Priorité (low/medium/high/urgent)
     - Compétences requises

2. **ANALYSE BUDGÉTAIRE**
   - Estimation réaliste du budget si non fourni
   - Répartition par phase

3. **RECOMMANDATIONS ARCADIS**
   - Bonnes pratiques selon le niveau ${arcadisLevel}
   - Points d'attention spécifiques
   - Suggestions d'optimisation

Réponds UNIQUEMENT en JSON valide selon cette structure :
{
  "phases": [
    {
      "name": "Nom de la phase",
      "description": "Description détaillée",
      "estimatedDuration": 15,
      "tasks": [
        {
          "title": "Titre de la tâche",
          "description": "Description détaillée de la tâche",
          "estimatedHours": 8,
          "priority": "medium",
          "requiredSkills": ["compétence1", "compétence2"]
        }
      ]
    }
  ],
  "totalEstimatedDuration": 60,
  "estimatedBudget": 5000000,
  "recommendations": ["recommandation 1", "recommandation 2"],
  "arcadisLevel": "${arcadisLevel}"
}
`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + geminiApiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: aiPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur API Gemini: ${response.status}`);
    }

    const data = await response.json();
    const aiText = data.candidates[0].content.parts[0].text;

    // Parser la réponse JSON de l'IA
    let aiSuggestion: AIProjectPlanSuggestion;
    try {
      // Nettoyer la réponse (enlever les markdown code blocks si présents)
      const cleanedText = aiText.replace(/```json\n?|\n?```/g, '').trim();
      aiSuggestion = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Erreur parsing JSON IA:', parseError);
      // Fallback avec un plan basique
      aiSuggestion = {
        phases: [
          {
            name: "Analyse et conception",
            description: "Phase d'analyse des besoins et de conception de la solution",
            estimatedDuration: 10,
            tasks: [
              {
                title: "Analyse des besoins",
                description: "Collecte et analyse des exigences",
                estimatedHours: 16,
                priority: "high",
                requiredSkills: ["analyse", "communication"]
              }
            ]
          },
          {
            name: "Développement",
            description: "Phase de développement de la solution",
            estimatedDuration: 20,
            tasks: [
              {
                title: "Développement principal",
                description: "Implémentation des fonctionnalités principales",
                estimatedHours: 40,
                priority: "high",
                requiredSkills: ["développement", "programmation"]
              }
            ]
          }
        ],
        totalEstimatedDuration: 30,
        estimatedBudget: budget || 1000000,
        recommendations: [
          "Définir clairement les objectifs du projet",
          "Planifier des points de contrôle réguliers",
          "Impliquer les parties prenantes dès le début"
        ],
        arcadisLevel
      };
    }

    // Log pour le suivi
    await supabase.from('ai_tasks_log').insert({
      task_type: 'project_planning',
      status: 'completed',
      input_data: { name, description, budget, clientType, industry },
      output_data: aiSuggestion
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: aiSuggestion,
        message: 'Plan de projet généré avec succès'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur project-planner-ai:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur lors de la génération du plan'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});