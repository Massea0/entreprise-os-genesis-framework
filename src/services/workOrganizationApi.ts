import { supabase } from '@/integrations/supabase/client';

export interface WorkOrganizationRequest {
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

export interface WorkloadAnalysis {
  summary: {
    total_employees: number;
    active_projects: number;
    pending_tasks: number;
    avg_workload: number;
  };
  employee_workloads: Array<{
    id: string;
    first_name: string;
    last_name: string;
    skills: string[];
    performance_score: number;
    workload: {
      total_hours: number;
      active_tasks: number;
      completion_rate: number;
    };
  }>;
  ai_analysis: string;
  recommendations: Array<{
    type: string;
    priority: 'low' | 'medium' | 'high';
    message: string;
    affected_employees?: string[];
    affected_tasks?: string[];
    action: string;
  }>;
}

export interface TaskAssignmentResult {
  assignments: Array<{
    task_id: string;
    employee_id: string;
    confidence: number;
    reasoning: string;
    status: 'assigned' | 'failed';
    task_data?: any;
    error?: string;
  }>;
  success_count: number;
  total_count: number;
}

export const workOrganizationApi = {
  async analyzeWorkload(request: Omit<WorkOrganizationRequest, 'action'>): Promise<WorkloadAnalysis> {
    const { data, error } = await supabase.functions.invoke('ai-work-organizer', {
      body: { ...request, action: 'analyze_workload' }
    });

    if (error) throw error;
    return data;
  },

  async assignTasks(request: Omit<WorkOrganizationRequest, 'action'>): Promise<TaskAssignmentResult> {
    const { data, error } = await supabase.functions.invoke('ai-work-organizer', {
      body: { ...request, action: 'assign_tasks' }
    });

    if (error) throw error;
    return data;
  },

  async optimizeResources(request: Omit<WorkOrganizationRequest, 'action'>): Promise<WorkloadAnalysis> {
    const { data, error } = await supabase.functions.invoke('ai-work-organizer', {
      body: { ...request, action: 'optimize_resources' }
    });

    if (error) throw error;
    return data;
  },

  async predictBottlenecks(request: Omit<WorkOrganizationRequest, 'action'>): Promise<WorkloadAnalysis> {
    const { data, error } = await supabase.functions.invoke('ai-work-organizer', {
      body: { ...request, action: 'predict_bottlenecks' }
    });

    if (error) throw error;
    return data;
  },

  // Helper methods for project management
  async getProjectTeam(projectId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        assignee_id,
        users:assignee_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('project_id', projectId)
      .not('assignee_id', 'is', null);

    if (error) throw error;

    // Deduplicate team members
    const uniqueMembers = new Map();
    data.forEach(task => {
      if (task.users && !uniqueMembers.has(task.assignee_id)) {
        uniqueMembers.set(task.assignee_id, task.users);
      }
    });

    return Array.from(uniqueMembers.values());
  },

  async getEmployeeProjects(employeeId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        project_id,
        projects (
          id,
          name,
          status,
          start_date,
          end_date,
          budget
        )
      `)
      .eq('assignee_id', employeeId)
      .not('projects', 'is', null);

    if (error) throw error;

    // Deduplicate projects
    const uniqueProjects = new Map();
    data.forEach(task => {
      if (task.projects && !uniqueProjects.has(task.project_id)) {
        uniqueProjects.set(task.project_id, task.projects);
      }
    });

    return Array.from(uniqueProjects.values());
  },

  async getTaskWorkload(filters?: {
    employee_id?: string;
    project_id?: string;
    status?: string;
    date_range?: { start: string; end: string };
  }) {
    let query = supabase
      .from('tasks')
      .select(`
        id,
        title,
        assignee_id,
        project_id,
        status,
        priority,
        estimated_hours,
        actual_hours,
        due_date,
        created_at,
        projects (name, status),
        users:assignee_id (first_name, last_name)
      `);

    if (filters?.employee_id) {
      query = query.eq('assignee_id', filters.employee_id);
    }

    if (filters?.project_id) {
      query = query.eq('project_id', filters.project_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.date_range) {
      query = query
        .gte('created_at', filters.date_range.start)
        .lte('created_at', filters.date_range.end);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data;
  }
};