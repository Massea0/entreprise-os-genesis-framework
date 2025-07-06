import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Employee {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  skills: string[];
  current_salary: number;
  performance_score: number;
  vacation_days_used: number;
  vacation_days_total: number;
  work_preferences: any;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  estimated_hours: number;
  due_date: string;
  complexity_score: number;
  labels: string[];
}

interface Assignment {
  employee_id: string;
  confidence_score: number;
  reasons: string[];
  availability_score: number;
  skill_match_score: number;
  workload_score: number;
  schedule_fit: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { taskId, requiredSkills = [], priorityLevel = 'medium' } = await req.json();

    // 1. Récupérer la tâche avec tous ses détails
    const { data: task, error: taskError } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError) throw taskError;

    // 2. Récupérer tous les employés avec leurs compétences et disponibilités
    const { data: employees, error: employeesError } = await supabaseClient
      .from('employees')
      .select(`
        *,
        user_id,
        first_name,
        last_name,
        skills,
        current_salary,
        performance_score,
        vacation_days_used,
        vacation_days_total,
        work_preferences
      `)
      .eq('employment_status', 'active');

    if (employeesError) throw employeesError;

    // 3. Récupérer les tâches actuelles de chaque employé pour calculer la charge
    const employeeIds = employees.map(emp => emp.user_id);
    const { data: currentTasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select('assignee_id, estimated_hours, status, due_date')
      .in('assignee_id', employeeIds)
      .in('status', ['todo', 'in_progress']);

    if (tasksError) throw tasksError;

    // 4. Calculer les scores d'assignation pour chaque employé
    const assignments: Assignment[] = employees.map(employee => {
      // Score de compétences (40% du poids)
      const employeeSkills = employee.skills || [];
      const skillMatches = requiredSkills.filter(skill => 
        employeeSkills.some(empSkill => 
          empSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(empSkill.toLowerCase())
        )
      );
      const skillMatchScore = requiredSkills.length > 0 
        ? (skillMatches.length / requiredSkills.length) * 100
        : 50; // Score neutre si pas de compétences spécifiées

      // Score de charge de travail (30% du poids)
      const employeeTasks = currentTasks?.filter(t => t.assignee_id === employee.user_id) || [];
      const totalWorkload = employeeTasks.reduce((sum, t) => sum + (t.estimated_hours || 2), 0);
      const maxWeeklyHours = 40;
      const workloadScore = Math.max(0, 100 - (totalWorkload / maxWeeklyHours) * 100);

      // Score de disponibilité (20% du poids)
      const vacationRatio = employee.vacation_days_used / employee.vacation_days_total;
      const availabilityScore = Math.max(0, 100 - (vacationRatio * 50));

      // Score de performance (10% du poids)
      const performanceScore = employee.performance_score || 50;

      // Score global pondéré
      const confidenceScore = Math.round(
        (skillMatchScore * 0.4) +
        (workloadScore * 0.3) +
        (availabilityScore * 0.2) +
        (performanceScore * 0.1)
      );

      // Générer les raisons de suggestion
      const reasons: string[] = [];
      if (skillMatchScore > 70) reasons.push(`Excellente adéquation des compétences (${Math.round(skillMatchScore)}%)`);
      if (workloadScore > 70) reasons.push(`Charge de travail faible (${Math.round(100-workloadScore)}h/semaine)`);
      if (performanceScore > 70) reasons.push(`Performance élevée (${performanceScore}/100)`);
      if (availabilityScore > 80) reasons.push("Haute disponibilité");

      // Calculer l'emploi du temps suggéré
      const dueDate = new Date(task.due_date || Date.now() + 7 * 24 * 60 * 60 * 1000);
      const estimatedHours = task.estimated_hours || 4;
      const daysNeeded = Math.ceil(estimatedHours / 8);
      const startDate = new Date();
      const suggestedEndDate = new Date(startDate.getTime() + daysNeeded * 24 * 60 * 60 * 1000);
      
      let scheduleFit = "Planning optimal";
      if (suggestedEndDate > dueDate) {
        const daysLate = Math.ceil((suggestedEndDate.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
        scheduleFit = `Risque de retard de ${daysLate} jour(s)`;
      }

      return {
        employee_id: employee.id,
        confidence_score: confidenceScore / 100,
        reasons,
        availability_score: availabilityScore,
        skill_match_score: skillMatchScore,
        workload_score: workloadScore,
        schedule_fit: scheduleFit
      };
    });

    // 5. Trier par score de confiance et prendre les 3 meilleurs
    const topAssignments = assignments
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, 3);

    // 6. Sauvegarder les suggestions dans la base
    const suggestions = topAssignments.map(assignment => ({
      task_id: taskId,
      suggested_assignee: employees.find(e => e.id === assignment.employee_id)?.user_id,
      confidence_score: assignment.confidence_score,
      suggestion_reasons: assignment.reasons,
      is_applied: false
    }));

    const { error: insertError } = await supabaseClient
      .from('task_assignment_suggestions')
      .insert(suggestions);

    if (insertError) throw insertError;

    // 7. Retourner les suggestions avec détails des employés
    const detailedSuggestions = topAssignments.map(assignment => {
      const employee = employees.find(e => e.id === assignment.employee_id);
      return {
        ...assignment,
        employee: {
          id: employee?.id,
          name: `${employee?.first_name} ${employee?.last_name}`,
          skills: employee?.skills || [],
          performance_score: employee?.performance_score,
          availability: `${Math.round(assignment.availability_score)}%`
        },
        schedule_analysis: {
          fit: assignment.schedule_fit,
          estimated_completion: new Date(Date.now() + (task.estimated_hours || 4) * 60 * 60 * 1000).toISOString(),
          workload_after_assignment: Math.round(100 - assignment.workload_score) + (task.estimated_hours || 4)
        }
      };
    });

    return new Response(JSON.stringify({
      task: {
        id: task.id,
        title: task.title,
        estimated_hours: task.estimated_hours,
        due_date: task.due_date
      },
      suggestions: detailedSuggestions,
      analysis: {
        total_candidates: employees.length,
        top_candidates: detailedSuggestions.length,
        algorithm_version: "v2.0-smart-scheduling"
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erreur dans smart-task-assignment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});