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
    const { taskId, diagramType = 'gantt' } = await req.json();
    
    if (!geminiApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Configuration manquante');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer les détails de la tâche avec le contexte du projet
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        *,
        projects(name, description, start_date, end_date)
      `)
      .eq('id', taskId)
      .single();

    // Récupérer l'assigné depuis la table employees si assignee_id existe
    let assigneeData = null;
    if (task && task.assignee_id) {
      const { data: employee } = await supabase
        .from('employees')
        .select('first_name, last_name, skills, performance_score')
        .eq('user_id', task.assignee_id)
        .maybeSingle();
      
      assigneeData = employee;
    }

    if (taskError) throw taskError;
    
    // Ajouter l'assigné aux données de la tâche
    const taskWithAssignee = { ...task, assignee: assigneeData };

    // Récupérer les tâches liées du même projet pour le contexte
    const { data: relatedTasks } = await supabase
      .from('tasks')
      .select('title, status, estimated_hours, due_date, priority')
      .eq('project_id', taskWithAssignee.project_id)
      .neq('id', taskId)
      .limit(10);

    let mermaidDiagram;
    switch (diagramType) {
      case 'gantt':
        mermaidDiagram = await generateGanttDiagram(taskWithAssignee, relatedTasks);
        break;
      case 'flowchart':
        mermaidDiagram = await generateFlowchartDiagram(taskWithAssignee);
        break;
      case 'mindmap':
        mermaidDiagram = await generateMindmapDiagram(taskWithAssignee);
        break;
      case 'timeline':
        mermaidDiagram = await generateTimelineDiagram(taskWithAssignee, relatedTasks);
        break;
      default:
        mermaidDiagram = await generateGanttDiagram(taskWithAssignee, relatedTasks);
    }

    return new Response(JSON.stringify({ 
      mermaidCode: mermaidDiagram,
      taskTitle: taskWithAssignee.title,
      diagramType 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erreur task-mermaid-generator:', error);
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

async function generateGanttDiagram(task: any, relatedTasks: any[] = []) {
  const prompt = `
Génère un diagramme Mermaid Gantt pour cette tâche et ses sous-tâches potentielles :

**TÂCHE PRINCIPALE:**
- Titre: ${task.title}
- Description: ${task.description || 'Aucune description'}
- Heures estimées: ${task.estimated_hours || 0}h
- Priorité: ${task.priority}
- Status: ${task.status}
- Échéance: ${task.due_date || 'Non définie'}
- Assigné à: ${task.assignee?.first_name} ${task.assignee?.last_name || 'Non assigné'}

**CONTEXTE PROJET:**
- Projet: ${task.projects?.name}
- Description projet: ${task.projects?.description || ''}

**TÂCHES LIÉES:**
${relatedTasks?.map(t => `- ${t.title} (${t.estimated_hours || 0}h, ${t.status})`).join('\n') || 'Aucune'}

Génère un diagramme Gantt Mermaid qui :
1. Décompose la tâche principale en 3-6 sous-tâches logiques
2. Estime réalistement la durée de chaque sous-tâche
3. Définit les dépendances entre sous-tâches
4. Respecte la durée totale estimée (${task.estimated_hours || 8}h)
5. Utilise des dates réalistes à partir d'aujourd'hui

Format de réponse UNIQUEMENT le code Mermaid, rien d'autre :

gantt
    title Planification: ${task.title}
    dateFormat  YYYY-MM-DD
    section Phase 1
        Sous-tâche 1    :active, t1, 2024-01-15, 2d
        ...
`;

  const response = await callGemini(prompt);
  
  // Nettoyer et extraire le code Mermaid
  let cleanedResponse = response.trim();
  
  // Supprimer les balises markdown si présentes
  if (cleanedResponse.includes('```mermaid')) {
    const match = cleanedResponse.match(/```mermaid\s*\n([\s\S]*?)\n```/);
    if (match) {
      cleanedResponse = match[1].trim();
    }
  } else if (cleanedResponse.includes('```')) {
    const match = cleanedResponse.match(/```\s*\n([\s\S]*?)\n```/);
    if (match) {
      cleanedResponse = match[1].trim();
    }
  }
  
  // Nettoyer les caractères invalides et les lignes vides
  cleanedResponse = cleanedResponse
    .replace(/[\r\n]+$/g, '') // Supprimer les sauts de ligne en fin
    .replace(/^\s*[\r\n]/gm, '') // Supprimer les lignes vides
    .replace(/\s+:/g, ':') // Nettoyer les espaces avant les deux-points
    .trim();
  
  return cleanedResponse;
}

async function generateFlowchartDiagram(task: any) {
  const prompt = `
Génère un diagramme flowchart Mermaid pour cette tâche montrant le processus étape par étape :

**TÂCHE:**
- Titre: ${task.title}
- Description: ${task.description || 'Aucune description'}
- Priorité: ${task.priority}

Crée un flowchart qui montre :
1. Le processus de réalisation de la tâche
2. Les points de décision
3. Les étapes de validation
4. Les possibles chemins alternatifs

Format de réponse UNIQUEMENT le code Mermaid :

flowchart TD
    A[Début] --> B{Première décision}
    ...
`;

  const response = await callGemini(prompt);
  const mermaidMatch = response.match(/```mermaid\n([\s\S]*?)\n```/) || response.match(/flowchart[\s\S]*/);
  return mermaidMatch ? mermaidMatch[1] || mermaidMatch[0] : response.trim();
}

async function generateMindmapDiagram(task: any) {
  const prompt = `
Génère un diagramme mindmap Mermaid pour cette tâche :

**TÂCHE:**
- Titre: ${task.title}
- Description: ${task.description || 'Aucune description'}
- Compétences assigné: ${JSON.stringify(task.assignee?.skills || [])}

Crée une mindmap qui organise :
1. Les aspects techniques
2. Les livrables
3. Les ressources nécessaires
4. Les risques potentiels

Format de réponse UNIQUEMENT le code Mermaid :

mindmap
  root((${task.title}))
    Technique
      ...
`;

  const response = await callGemini(prompt);
  const mermaidMatch = response.match(/```mermaid\n([\s\S]*?)\n```/) || response.match(/mindmap[\s\S]*/);
  return mermaidMatch ? mermaidMatch[1] || mermaidMatch[0] : response.trim();
}

async function generateTimelineDiagram(task: any, relatedTasks: any[] = []) {
  const prompt = `
Génère un diagramme timeline Mermaid pour cette tâche dans le contexte de son projet :

**TÂCHE PRINCIPALE:**
- Titre: ${task.title}
- Échéance: ${task.due_date || 'Non définie'}
- Heures estimées: ${task.estimated_hours || 0}h

**TÂCHES LIÉES DU PROJET:**
${relatedTasks?.map(t => `- ${t.title} (${t.status}, échéance: ${t.due_date || 'Non définie'})`).join('\n') || 'Aucune'}

Crée une timeline qui montre :
1. Les jalons importants
2. Les dates clés
3. Les dépendances temporelles

Format de réponse UNIQUEMENT le code Mermaid :

timeline
    title Chronologie: ${task.title}
    
    Semaine 1 : Démarrage
              : ...
`;

  const response = await callGemini(prompt);
  const mermaidMatch = response.match(/```mermaid\n([\s\S]*?)\n```/) || response.match(/timeline[\s\S]*/);
  return mermaidMatch ? mermaidMatch[1] || mermaidMatch[0] : response.trim();
}