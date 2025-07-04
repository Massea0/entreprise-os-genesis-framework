import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskToCreate {
  title: string;
  description: string;
  estimatedHours: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requiredSkills?: string[];
  phase?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const { projectId, tasks, autoAssign = false } = await req.json();

    if (!projectId || !tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'ID projet et liste de tâches requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier que le projet existe
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Projet introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const createdTasks: any[] = [];
    const errors: string[] = [];

    // Si auto assignation activée, récupérer les employés
    let employees: any[] = [];
    if (autoAssign) {
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select(`
          id, first_name, last_name, user_id,
          skills,
          positions!inner(title, required_skills)
        `)
        .eq('employment_status', 'active');

      if (!empError && empData) {
        employees = empData;
      }
    }

    // Fonction pour suggérer un assigné basé sur les compétences
    const suggestAssignee = (task: TaskToCreate) => {
      if (!autoAssign || employees.length === 0) return null;

      const requiredSkills = task.requiredSkills || [];
      if (requiredSkills.length === 0) {
        // Assignation aléatoire si pas de compétences spécifiées
        return employees[Math.floor(Math.random() * employees.length)];
      }

      // Calculer le score de compatibilité pour chaque employé
      let bestEmployee = null;
      let bestScore = 0;

      employees.forEach(emp => {
        let score = 0;
        const empSkills = [...(emp.skills || []), ...(emp.positions?.required_skills || [])];
        
        requiredSkills.forEach(skill => {
          const skillLower = skill.toLowerCase();
          if (empSkills.some(empSkill => empSkill.toLowerCase().includes(skillLower))) {
            score += 1;
          }
        });

        // Bonus pour correspondance exacte
        const exactMatches = requiredSkills.filter(skill =>
          empSkills.some(empSkill => empSkill.toLowerCase() === skill.toLowerCase())
        );
        score += exactMatches.length * 0.5;

        if (score > bestScore) {
          bestScore = score;
          bestEmployee = emp;
        }
      });

      return bestEmployee || employees[0]; // Fallback vers premier employé si aucun match
    };

    // Créer les tâches une par une
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i] as TaskToCreate;
      
      try {
        // Validation de base
        if (!task.title || task.title.trim() === '') {
          errors.push(`Tâche ${i + 1}: Titre requis`);
          continue;
        }

        // Suggérer un assigné si auto assignation
        const suggestedEmployee = suggestAssignee(task);
        const assigneeId = suggestedEmployee ? (suggestedEmployee.user_id || suggestedEmployee.id) : null;

        // Préparer les données de la tâche
        const taskData = {
          project_id: projectId,
          title: task.title.trim(),
          description: task.description || '',
          priority: task.priority || 'medium',
          estimated_hours: task.estimatedHours || null,
          assignee_id: assigneeId,
          status: 'todo',
          position: i, // Position pour l'ordre
          custom_fields: {
            phase: task.phase || null,
            required_skills: task.requiredSkills || [],
            auto_assigned: !!assigneeId,
            suggested_by_ai: autoAssign
          }
        };

        // Insérer la tâche
        const { data: createdTask, error: taskError } = await supabase
          .from('tasks')
          .insert([taskData])
          .select(`
            *,
            assignee:assignee_id(first_name, last_name)
          `)
          .single();

        if (taskError) {
          errors.push(`Tâche "${task.title}": ${taskError.message}`);
          continue;
        }

        createdTasks.push({
          ...createdTask,
          suggestedEmployee: suggestedEmployee ? {
            id: suggestedEmployee.id,
            name: `${suggestedEmployee.first_name} ${suggestedEmployee.last_name}`,
            position: suggestedEmployee.positions?.title
          } : null
        });

      } catch (taskError) {
        console.error(`Erreur création tâche ${i + 1}:`, taskError);
        errors.push(`Tâche "${task.title}": ${taskError.message}`);
      }
    }

    // Log de l'opération
    await supabase.from('ai_tasks_log').insert({
      task_type: 'bulk_create_tasks',
      status: errors.length === 0 ? 'completed' : 'partial',
      input_data: { projectId, tasksCount: tasks.length, autoAssign },
      output_data: { 
        created: createdTasks.length, 
        errors: errors.length,
        errorDetails: errors 
      }
    });

    const success = createdTasks.length > 0;
    const statusCode = success ? (errors.length > 0 ? 207 : 200) : 400; // 207 = Multi-Status

    return new Response(
      JSON.stringify({
        success,
        data: {
          project: project.name,
          created: createdTasks,
          errors,
          summary: {
            total: tasks.length,
            created: createdTasks.length,
            failed: errors.length,
            autoAssigned: createdTasks.filter(t => t.assignee_id).length
          }
        },
        message: `${createdTasks.length}/${tasks.length} tâches créées${errors.length > 0 ? ` (${errors.length} erreurs)` : ''}`
      }),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erreur bulk-create-tasks:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur lors de la création en lot des tâches'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});