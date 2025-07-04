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
    const projectId = pathParts[pathParts.length - 1];
    
    switch (req.method) {
      case 'GET':
        if (projectId && projectId !== 'projects-api') {
          // Get single project with tasks count and progress
          const { data: project, error: projectError } = await supabase
            .from('projects')
            .select(`
              *,
              tasks(count),
              client_company:companies(name),
              owner:users(first_name, last_name, email)
            `)
            .eq('id', projectId)
            .single();

          if (projectError) {
            return new Response(
              JSON.stringify({ success: false, error: projectError.message }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Get tasks for progress calculation
          const { data: tasks } = await supabase
            .from('tasks')
            .select('status')
            .eq('project_id', projectId);

          const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
          const totalTasks = tasks?.length || 0;
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          return new Response(
            JSON.stringify({
              success: true,
              data: { ...project, progress, tasksCount: totalTasks }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Get all projects with pagination and filters
          const page = parseInt(url.searchParams.get('page') || '1');
          const limit = parseInt(url.searchParams.get('limit') || '10');
          const search = url.searchParams.get('search');
          const status = url.searchParams.get('status');
          const clientId = url.searchParams.get('client_id');

          let query = supabase
            .from('projects')
            .select(`
              *,
              client_company:companies(name),
              owner:users(first_name, last_name, email)
            `, { count: 'exact' })
            .range((page - 1) * limit, page * limit - 1)
            .order('created_at', { ascending: false });

          if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
          }
          if (status) {
            query = query.eq('status', status);
          }
          if (clientId) {
            query = query.eq('client_company_id', clientId);
          }

          const { data: projects, error, count } = await query;

          if (error) {
            return new Response(
              JSON.stringify({ success: false, error: error.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Add progress and tasks count for each project
          const projectsWithStats = await Promise.all(
            (projects || []).map(async (project) => {
              const { data: tasks } = await supabase
                .from('tasks')
                .select('status')
                .eq('project_id', project.id);

              const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
              const totalTasks = tasks?.length || 0;
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return { ...project, progress, tasksCount: totalTasks };
            })
          );

          return new Response(
            JSON.stringify({
              success: true,
              data: projectsWithStats,
              total: count,
              page,
              limit
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

      case 'POST':
        const projectData = await req.json();
        
        const { data: newProject, error: createError } = await supabase
          .from('projects')
          .insert([{
            name: projectData.name,
            description: projectData.description,
            client_company_id: projectData.client_company_id,
            status: projectData.status || 'planning',
            start_date: projectData.start_date,
            end_date: projectData.end_date,
            budget: projectData.budget,
            owner_id: projectData.owner_id,
            custom_fields: projectData.custom_fields || {}
          }])
          .select()
          .single();

        if (createError) {
          return new Response(
            JSON.stringify({ success: false, error: createError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data: newProject }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'PUT':
        if (!projectId || projectId === 'projects-api') {
          return new Response(
            JSON.stringify({ success: false, error: 'Project ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const updateData = await req.json();
        
        const { data: updatedProject, error: updateError } = await supabase
          .from('projects')
          .update({
            name: updateData.name,
            description: updateData.description,
            client_company_id: updateData.client_company_id,
            status: updateData.status,
            start_date: updateData.start_date,
            end_date: updateData.end_date,
            budget: updateData.budget,
            owner_id: updateData.owner_id,
            custom_fields: updateData.custom_fields,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId)
          .select()
          .single();

        if (updateError) {
          return new Response(
            JSON.stringify({ success: false, error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data: updatedProject }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'DELETE':
        if (!projectId || projectId === 'projects-api') {
          return new Response(
            JSON.stringify({ success: false, error: 'Project ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: deleteError } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId);

        if (deleteError) {
          return new Response(
            JSON.stringify({ success: false, error: deleteError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Project deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in projects-api:', error);
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