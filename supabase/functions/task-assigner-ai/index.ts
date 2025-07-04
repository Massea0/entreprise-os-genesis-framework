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

interface AITaskAssignmentSuggestion {
  suggestedAssigneeId: string;
  suggestedAssigneeName: string;
  confidence: number;
  reasoning: string;
  alternativeAssignees: {
    id: string;
    name: string;
    score: number;
    reason: string;
  }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const { taskTitle, taskDescription, requiredSkills, priority, projectId } = await req.json();

    if (!taskTitle || !projectId) {
      return new Response(
        JSON.stringify({ error: 'Titre de tâche et ID projet requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les employés actifs avec leurs compétences et charge de travail
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select(`
        id, first_name, last_name, user_id,
        skills,
        positions!inner(title, required_skills),
        departments!inner(name)
      `)
      .eq('employment_status', 'active');

    if (empError) {
      throw new Error(`Erreur récupération employés: ${empError.message}`);
    }

    // Récupérer les tâches actuelles pour calculer la charge de travail
    const { data: currentTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('assignee_id, estimated_hours, status')
      .in('status', ['todo', 'in_progress']);

    if (tasksError) {
      console.warn('Erreur récupération tâches:', tasksError);
    }

    // Calculer la charge de travail actuelle par employé
    const workloadMap = new Map<string, number>();
    if (currentTasks) {
      currentTasks.forEach(task => {
        if (task.assignee_id && task.estimated_hours) {
          const current = workloadMap.get(task.assignee_id) || 0;
          workloadMap.set(task.assignee_id, current + task.estimated_hours);
        }
      });
    }

    // Préparer les données pour l'IA
    const employeesData = employees?.map(emp => ({
      id: emp.user_id || emp.id,
      name: `${emp.first_name} ${emp.last_name}`,
      position: emp.positions?.title || 'Non défini',
      department: emp.departments?.name || 'Non défini',
      skills: emp.skills || [],
      positionSkills: emp.positions?.required_skills || [],
      currentWorkload: workloadMap.get(emp.user_id || emp.id) || 0
    })) || [];

    const aiPrompt = `
En tant qu'IA d'assignation de tâches chez Arcadis Technologies, analyse cette tâche et suggère le meilleur employé :

**TÂCHE À ASSIGNER:**
- Titre: ${taskTitle}
- Description: ${taskDescription || 'Non spécifiée'}
- Compétences requises: ${requiredSkills?.join(', ') || 'Non spécifiées'}
- Priorité: ${priority || 'medium'}

**EMPLOYÉS DISPONIBLES:**
${employeesData.map(emp => `
- ${emp.name} (${emp.position})
  • Département: ${emp.department}
  • Compétences personnelles: ${Array.isArray(emp.skills) ? emp.skills.join(', ') : 'Non définies'}
  • Compétences poste: ${Array.isArray(emp.positionSkills) ? emp.positionSkills.join(', ') : 'Non définies'}
  • Charge actuelle: ${emp.currentWorkload}h
`).join('\n')}

**CRITÈRES D'ÉVALUATION:**
1. Adéquation des compétences (40%)
2. Charge de travail actuelle (30%)
3. Expérience dans le type de tâche (20%)
4. Disponibilité et priorité (10%)

Analyse chaque employé et suggère le meilleur assigné avec des alternatives.

Réponds UNIQUEMENT en JSON valide :
{
  "suggestedAssigneeId": "id_employé",
  "suggestedAssigneeName": "Nom Prénom",
  "confidence": 85,
  "reasoning": "Explication détaillée du choix",
  "alternativeAssignees": [
    {
      "id": "id_alternatif",
      "name": "Nom Alternatif",
      "score": 70,
      "reason": "Raison du score"
    }
  ]
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
          temperature: 0.3,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur API Gemini: ${response.status}`);
    }

    const data = await response.json();
    const aiText = data.candidates[0].content.parts[0].text;

    let aiSuggestion: AITaskAssignmentSuggestion;
    try {
      const cleanedText = aiText.replace(/```json\n?|\n?```/g, '').trim();
      aiSuggestion = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Erreur parsing JSON IA:', parseError);
      
      // Fallback avec assignation simple basée sur charge de travail
      const sortedByWorkload = employeesData.sort((a, b) => a.currentWorkload - b.currentWorkload);
      const suggested = sortedByWorkload[0];
      
      if (!suggested) {
        throw new Error('Aucun employé disponible pour assignation');
      }

      aiSuggestion = {
        suggestedAssigneeId: suggested.id,
        suggestedAssigneeName: suggested.name,
        confidence: 60,
        reasoning: `Assigné automatiquement à ${suggested.name} (charge de travail la plus faible: ${suggested.currentWorkload}h)`,
        alternativeAssignees: sortedByWorkload.slice(1, 3).map(emp => ({
          id: emp.id,
          name: emp.name,
          score: Math.max(40, 60 - (emp.currentWorkload - suggested.currentWorkload) * 2),
          reason: `Charge de travail: ${emp.currentWorkload}h`
        }))
      };
    }

    // Vérifier que l'employé suggéré existe
    const suggestedExists = employeesData.find(emp => emp.id === aiSuggestion.suggestedAssigneeId);
    if (!suggestedExists && employeesData.length > 0) {
      // Fallback vers le premier employé disponible
      const fallback = employeesData[0];
      aiSuggestion.suggestedAssigneeId = fallback.id;
      aiSuggestion.suggestedAssigneeName = fallback.name;
      aiSuggestion.confidence = Math.max(50, aiSuggestion.confidence - 20);
      aiSuggestion.reasoning += ` (Corrigé automatiquement vers ${fallback.name})`;
    }

    // Log pour le suivi
    await supabase.from('ai_tasks_log').insert({
      task_type: 'task_assignment',
      status: 'completed',
      input_data: { taskTitle, taskDescription, requiredSkills, priority, projectId },
      output_data: aiSuggestion
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: aiSuggestion,
        message: 'Suggestion d\'assignation générée avec succès'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur task-assigner-ai:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur lors de la suggestion d\'assignation'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});