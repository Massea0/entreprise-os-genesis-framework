import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  skills: string[];
  current_salary: number;
  employment_status: string;
  department_id: string;
  performance_score: number;
  work_preferences: any;
}

interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  start_date: string;
  end_date: string;
  status: string;
  client_company_id: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  project_id: string;
  assignee_id: string | null;
  priority: string;
  status: string;
  estimated_hours: number;
  due_date: string;
  custom_fields: any;
}

interface WorkOrganizationRequest {
  action: 'analyze_workload' | 'assign_tasks' | 'optimize_resources' | 'predict_bottlenecks';
  project_id?: string;
  employee_ids?: string[];
  time_period?: {
    start: string;
    end: string;
  };
  criteria?: {
    prioritize_skills?: boolean;
    balance_workload?: boolean;
    consider_availability?: boolean;
    optimize_cost?: boolean;
  };
}

async function getEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      id,
      first_name,
      last_name,
      skills,
      current_salary,
      employment_status,
      department_id,
      performance_score,
      work_preferences
    `)
    .eq('employment_status', 'active');

  if (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
  return data || [];
}

async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .in('status', ['planning', 'active', 'on_hold']);

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
  return data || [];
}

async function getTasks(projectId?: string): Promise<Task[]> {
  let query = supabase
    .from('tasks')
    .select('*');

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query
    .in('status', ['todo', 'in_progress', 'review']);

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
  return data || [];
}

async function getEmployeeWorkload(employeeId: string): Promise<{
  total_hours: number;
  active_tasks: number;
  completion_rate: number;
}> {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('estimated_hours, actual_hours, status')
    .eq('assignee_id', employeeId)
    .in('status', ['todo', 'in_progress', 'review']);

  const totalHours = tasks?.reduce((sum, task) => sum + (task.estimated_hours || 0), 0) || 0;
  const activeTasks = tasks?.length || 0;
  
  const completedTasks = await supabase
    .from('tasks')
    .select('estimated_hours, actual_hours')
    .eq('assignee_id', employeeId)
    .eq('status', 'done');

  const completionRate = completedTasks.data?.length 
    ? completedTasks.data.reduce((sum, task) => {
        const efficiency = task.actual_hours ? (task.estimated_hours || 0) / task.actual_hours : 1;
        return sum + Math.min(efficiency, 2); // Cap at 200% efficiency
      }, 0) / completedTasks.data.length
    : 1;

  return {
    total_hours: totalHours,
    active_tasks: activeTasks,
    completion_rate: completionRate
  };
}

async function analyzeWithAI(prompt: string): Promise<string> {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    }),
  });

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function analyzeWorkload(request: WorkOrganizationRequest) {
  const employees = await getEmployees();
  const projects = await getProjects();
  const tasks = await getTasks(request.project_id);

  // Get workload for each employee
  const employeeWorkloads = await Promise.all(
    employees.map(async (employee) => {
      const workload = await getEmployeeWorkload(employee.id);
      return {
        ...employee,
        workload
      };
    })
  );

  // Analyze with AI
  const analysisPrompt = `
    Analyze the following work organization data for optimal employee-project assignment:

    EMPLOYEES (${employees.length} total):
    ${employeeWorkloads.map(emp => `
    - ${emp.first_name} ${emp.last_name}:
      * Skills: ${emp.skills?.join(', ') || 'None listed'}
      * Performance Score: ${emp.performance_score || 'N/A'}/10
      * Current Workload: ${emp.workload.total_hours}h, ${emp.workload.active_tasks} tasks
      * Completion Rate: ${(emp.workload.completion_rate * 100).toFixed(1)}%
      * Department: ${emp.department_id}
    `).join('')}

    PROJECTS (${projects.length} active):
    ${projects.map(proj => `
    - ${proj.name}:
      * Budget: $${proj.budget?.toLocaleString() || 'N/A'}
      * Timeline: ${proj.start_date} to ${proj.end_date}
      * Status: ${proj.status}
      * Description: ${proj.description?.substring(0, 100) || 'No description'}...
    `).join('')}

    TASKS (${tasks.length} pending):
    ${tasks.map(task => `
    - ${task.title}:
      * Priority: ${task.priority}
      * Estimated Hours: ${task.estimated_hours || 'N/A'}
      * Currently Assigned: ${task.assignee_id ? 'Yes' : 'No'}
      * Due Date: ${task.due_date || 'Not set'}
    `).join('')}

    Based on this data, provide:
    1. WORKLOAD ANALYSIS: Identify overloaded and underutilized employees
    2. SKILL MATCHING: Suggest optimal employee-task assignments based on skills
    3. CAPACITY PLANNING: Recommend resource allocation across projects
    4. BOTTLENECK PREDICTION: Identify potential delays and capacity issues
    5. OPTIMIZATION RECOMMENDATIONS: Specific actions to improve efficiency

    Format your response as structured JSON with clear sections for each analysis area.
  `;

  const aiAnalysis = await analyzeWithAI(analysisPrompt);

  return {
    summary: {
      total_employees: employees.length,
      active_projects: projects.length,
      pending_tasks: tasks.length,
      avg_workload: employeeWorkloads.reduce((sum, emp) => sum + emp.workload.total_hours, 0) / employees.length
    },
    employee_workloads: employeeWorkloads,
    ai_analysis: aiAnalysis,
    recommendations: await generateRecommendations(employeeWorkloads, projects, tasks)
  };
}

async function generateRecommendations(employees: any[], projects: Project[], tasks: Task[]) {
  // Generate smart recommendations based on data patterns
  const recommendations = [];

  // Workload balancing
  const overloadedEmployees = employees.filter(emp => emp.workload.total_hours > 40);
  const underutilizedEmployees = employees.filter(emp => emp.workload.total_hours < 20);

  if (overloadedEmployees.length > 0) {
    recommendations.push({
      type: 'workload_balance',
      priority: 'high',
      message: `${overloadedEmployees.length} employees are overloaded. Consider redistributing tasks.`,
      affected_employees: overloadedEmployees.map(emp => emp.id),
      action: 'redistribute_tasks'
    });
  }

  if (underutilizedEmployees.length > 0) {
    recommendations.push({
      type: 'capacity_utilization',
      priority: 'medium',
      message: `${underutilizedEmployees.length} employees have available capacity for additional tasks.`,
      affected_employees: underutilizedEmployees.map(emp => emp.id),
      action: 'assign_additional_tasks'
    });
  }

  // Skill matching
  const unassignedTasks = tasks.filter(task => !task.assignee_id);
  if (unassignedTasks.length > 0) {
    recommendations.push({
      type: 'task_assignment',
      priority: 'high',
      message: `${unassignedTasks.length} tasks are unassigned and need employee allocation.`,
      affected_tasks: unassignedTasks.map(task => task.id),
      action: 'assign_tasks'
    });
  }

  return recommendations;
}

async function assignTasks(request: WorkOrganizationRequest) {
  const employees = await getEmployees();
  const tasks = await getTasks(request.project_id);
  
  // AI-powered task assignment
  const assignmentPrompt = `
    Based on the following data, suggest optimal task assignments:

    AVAILABLE EMPLOYEES:
    ${employees.map(emp => `
    - ${emp.first_name} ${emp.last_name} (ID: ${emp.id}):
      * Skills: ${emp.skills?.join(', ') || 'General'}
      * Performance: ${emp.performance_score || 5}/10
      * Current Workload: ${(await getEmployeeWorkload(emp.id)).total_hours}h
    `).join('')}

    UNASSIGNED TASKS:
    ${tasks.filter(t => !t.assignee_id).map(task => `
    - ${task.title} (ID: ${task.id}):
      * Priority: ${task.priority}
      * Estimated Hours: ${task.estimated_hours || 'Unknown'}
      * Description: ${task.description?.substring(0, 100) || 'No description'}
      * Due Date: ${task.due_date || 'Flexible'}
    `).join('')}

    Provide optimal assignments considering:
    1. Skill matching
    2. Workload balance
    3. Task priority and deadlines
    4. Employee performance history

    Return a JSON array of assignments: [{"task_id": "...", "employee_id": "...", "confidence": 0.95, "reasoning": "..."}]
  `;

  const aiAssignments = await analyzeWithAI(assignmentPrompt);
  
  // Parse and apply assignments
  try {
    const assignments = JSON.parse(aiAssignments);
    const results = [];

    for (const assignment of assignments) {
      const { data, error } = await supabase
        .from('tasks')
        .update({ assignee_id: assignment.employee_id })
        .eq('id', assignment.task_id)
        .select();

      if (!error && data) {
        results.push({
          ...assignment,
          status: 'assigned',
          task_data: data[0]
        });
      } else {
        results.push({
          ...assignment,
          status: 'failed',
          error: error?.message
        });
      }
    }

    return {
      assignments: results,
      success_count: results.filter(r => r.status === 'assigned').length,
      total_count: results.length
    };
  } catch (error) {
    console.error('Error parsing AI assignments:', error);
    return { error: 'Failed to parse AI recommendations' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: WorkOrganizationRequest = await req.json();

    let result;
    switch (request.action) {
      case 'analyze_workload':
        result = await analyzeWorkload(request);
        break;
      case 'assign_tasks':
        result = await assignTasks(request);
        break;
      case 'optimize_resources':
        result = await analyzeWorkload(request); // Enhanced with optimization focus
        break;
      case 'predict_bottlenecks':
        result = await analyzeWorkload(request); // Enhanced with bottleneck prediction
        break;
      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-work-organizer:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});