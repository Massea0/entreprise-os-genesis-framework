import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

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
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    
    // Handle different endpoints
    if (pathParts.includes('reorder')) {
      // Handle task reordering for drag & drop
      const { taskIds, newPositions } = await req.json();
      
      if (!taskIds || !newPositions || taskIds.length !== newPositions.length) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid reorder data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Use the database function for atomic reordering
      const { data, error } = await supabase.rpc('reorder_tasks', {
        task_ids: taskIds,
        new_positions: newPositions
      });

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Tasks reordered successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (pathParts.includes('project')) {
      // Get tasks for a specific project
      const projectId = pathParts[pathParts.indexOf('project') + 1];
      const status = url.searchParams.get('status');
      const assigneeId = url.searchParams.get('assignee_id');
      const priority = url.searchParams.get('priority');

      let query = supabase
        .from('tasks')
        .select(`
          *,
          assignee:users(first_name, last_name, email),
          project:projects(name)
        `)
        .eq('project_id', projectId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }
      if (assigneeId) {
        query = query.eq('assignee_id', assigneeId);
      }
      if (priority) {
        query = query.eq('priority', priority);
      }

      const { data: tasks, error } = await query;

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: tasks }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const taskId = lastPart !== 'tasks-api' ? lastPart : null;
    
    switch (req.method) {
      case 'GET':
        if (taskId) {
          // Get single task with relations
          const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select(`
              *,
              assignee:users(first_name, last_name, email),
              project:projects(name, client_company_id)
            `)
            .eq('id', taskId)
            .single();

          if (taskError) {
            return new Response(
              JSON.stringify({ success: false, error: taskError.message }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ success: true, data: task }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Get all tasks with pagination and filters
          const page = parseInt(url.searchParams.get('page') || '1');
          const limit = parseInt(url.searchParams.get('limit') || '20');
          const search = url.searchParams.get('search');
          const status = url.searchParams.get('status');
          const projectId = url.searchParams.get('project_id');
          const assigneeId = url.searchParams.get('assignee_id');
          const priority = url.searchParams.get('priority');

          let query = supabase
            .from('tasks')
            .select(`
              *,
              assignee:users(first_name, last_name, email),
              project:projects(name)
            `, { count: 'exact' })
            .range((page - 1) * limit, page * limit - 1)
            .order('position', { ascending: true })
            .order('created_at', { ascending: false });

          if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
          }
          if (status) {
            query = query.eq('status', status);
          }
          if (projectId) {
            query = query.eq('project_id', projectId);
          }
          if (assigneeId) {
            query = query.eq('assignee_id', assigneeId);
          }
          if (priority) {
            query = query.eq('priority', priority);
          }

          const { data: tasks, error, count } = await query;

          if (error) {
            return new Response(
              JSON.stringify({ success: false, error: error.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({
              success: true,
              data: tasks,
              total: count,
              page,
              limit
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

      case 'POST':
        const taskData = await req.json();
        
        // Get the highest position for the project to append the new task
        const { data: lastTask } = await supabase
          .from('tasks')
          .select('position')
          .eq('project_id', taskData.project_id)
          .order('position', { ascending: false })
          .limit(1)
          .single();

        const nextPosition = (lastTask?.position || 0) + 1;

        const { data: newTask, error: createError } = await supabase
          .from('tasks')
          .insert([{
            project_id: taskData.project_id,
            title: taskData.title,
            description: taskData.description,
            status: taskData.status || 'todo',
            assignee_id: taskData.assignee_id,
            due_date: taskData.due_date,
            priority: taskData.priority || 'medium',
            estimated_hours: taskData.estimated_hours,
            position: nextPosition,
            custom_fields: taskData.custom_fields || {}
          }])
          .select(`
            *,
            assignee:users(first_name, last_name, email),
            project:projects(name)
          `)
          .single();

        if (createError) {
          return new Response(
            JSON.stringify({ success: false, error: createError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data: newTask }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'PUT':
        if (!taskId) {
          return new Response(
            JSON.stringify({ success: false, error: 'Task ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const updateData = await req.json();
        
        const { data: updatedTask, error: updateError } = await supabase
          .from('tasks')
          .update({
            title: updateData.title,
            description: updateData.description,
            status: updateData.status,
            assignee_id: updateData.assignee_id,
            due_date: updateData.due_date,
            priority: updateData.priority,
            estimated_hours: updateData.estimated_hours,
            actual_hours: updateData.actual_hours,
            custom_fields: updateData.custom_fields,
            updated_at: new Date().toISOString()
          })
          .eq('id', taskId)
          .select(`
            *,
            assignee:users(first_name, last_name, email),
            project:projects(name)
          `)
          .single();

        if (updateError) {
          return new Response(
            JSON.stringify({ success: false, error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data: updatedTask }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'DELETE':
        if (!taskId) {
          return new Response(
            JSON.stringify({ success: false, error: 'Task ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskId);

        if (deleteError) {
          return new Response(
            JSON.stringify({ success: false, error: deleteError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Task deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in tasks-api:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});