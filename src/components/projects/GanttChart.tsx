import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, User, ArrowRight } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface GanttTask {
  id: string;
  title: string;
  due_date: string;
  assignee?: {
    first_name: string;
    last_name: string;
  };
  status: string;
  priority: string;
}

interface GanttProject {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  tasks: GanttTask[];
}

const TASK_STATUSES = {
  'todo': { label: 'À faire', color: 'bg-slate-500' },
  'in_progress': { label: 'En cours', color: 'bg-blue-500' },
  'review': { label: 'En révision', color: 'bg-purple-500' },
  'done': { label: 'Terminé', color: 'bg-green-500' }
};

const PRIORITIES = {
  'low': { label: 'Faible', color: 'border-blue-300' },
  'medium': { label: 'Moyenne', color: 'border-yellow-300' },
  'high': { label: 'Élevée', color: 'border-red-300' }
};

export const GanttChart = ({ projectId }: { projectId?: string }) => {
  const [projects, setProjects] = useState<GanttProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineStart, setTimelineStart] = useState<Date>(new Date());
  const [timelineEnd, setTimelineEnd] = useState<Date>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    loadGanttData();
  }, [projectId]);

  const loadGanttData = async () => {
    try {
      setLoading(true);
      
      let projectsQuery = supabase
        .from('projects')
        .select(`
          *,
          tasks(
            *,
            assignee:assignee_id(first_name, last_name)
          )
        `)
        .not('start_date', 'is', null)
        .not('end_date', 'is', null);

      if (projectId) {
        projectsQuery = projectsQuery.eq('id', projectId);
      }

      const { data: projectsData, error } = await projectsQuery;

      if (error) throw error;

      const ganttProjects = (projectsData || []).map(project => ({
        ...project,
        tasks: (project.tasks || []).filter(task => 
          task.due_date && task.status !== 'done'
        ).map(task => ({
          id: task.id,
          title: task.title,
          due_date: task.due_date,
          assignee: task.assignee,
          status: task.status,
          priority: task.priority
        }))
      }));

      setProjects(ganttProjects);

      // Calculate timeline range
      if (ganttProjects.length > 0) {
        const allDates = ganttProjects.flatMap(p => [
          new Date(p.start_date),
          new Date(p.end_date),
          ...p.tasks.map(t => new Date(t.due_date))
        ]).filter(d => !isNaN(d.getTime()));

        if (allDates.length > 0) {
          const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
          const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
          
          // Add buffer
          minDate.setDate(minDate.getDate() - 7);
          maxDate.setDate(maxDate.getDate() + 7);
          
          setTimelineStart(minDate);
          setTimelineEnd(maxDate);
        }
      }

    } catch (error) {
      console.error('Error loading Gantt data:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors du chargement des données Gantt"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePosition = (date: string) => {
    const taskDate = parseISO(date);
    const totalDays = differenceInDays(timelineEnd, timelineStart);
    const daysFromStart = differenceInDays(taskDate, timelineStart);
    return Math.max(0, Math.min(100, (daysFromStart / totalDays) * 100));
  };

  const calculateWidth = (startDate: string, endDate: string) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const taskDays = differenceInDays(end, start);
    const totalDays = differenceInDays(timelineEnd, timelineStart);
    return Math.max(2, (taskDays / totalDays) * 100);
  };

  const generateTimelineHeaders = () => {
    const headers = [];
    const currentDate = new Date(timelineStart);
    
    while (currentDate <= timelineEnd) {
      headers.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 7); // Weekly headers
    }
    
    return headers;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Diagramme de Gantt
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun projet avec dates définies</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Timeline Header */}
              <div className="mb-4">
                <div className="flex border-b pb-2">
                  <div className="w-64 flex-shrink-0 font-medium">Projets/Tâches</div>
                  <div className="flex-1 relative">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      {generateTimelineHeaders().map((date, index) => (
                        <div key={index} className="text-center">
                          {format(date, 'dd MMM', { locale: fr })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Projects and Tasks */}
              <div className="space-y-6">
                {projects.map((project) => (
                  <div key={project.id} className="space-y-2">
                    {/* Project Row */}
                    <div className="flex items-center">
                      <div className="w-64 flex-shrink-0">
                        <div className="font-semibold text-sm">{project.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(parseISO(project.start_date), 'dd MMM', { locale: fr })} - 
                          {format(parseISO(project.end_date), 'dd MMM', { locale: fr })}
                        </div>
                      </div>
                      <div className="flex-1 relative h-8 bg-muted/30 rounded">
                        <div
                          className="absolute top-1 bottom-1 bg-primary rounded"
                          style={{
                            left: `${calculatePosition(project.start_date)}%`,
                            width: `${calculateWidth(project.start_date, project.end_date)}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Tasks Rows */}
                    {project.tasks.map((task) => (
                      <div key={task.id} className="flex items-center ml-4">
                        <div className="w-60 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{task.title}</span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${PRIORITIES[task.priority as keyof typeof PRIORITIES]?.color}`}
                            >
                              {PRIORITIES[task.priority as keyof typeof PRIORITIES]?.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 ml-5 mt-1">
                            {task.assignee && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                {task.assignee.first_name} {task.assignee.last_name}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(parseISO(task.due_date), 'dd MMM', { locale: fr })}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 relative h-6 bg-muted/20 rounded">
                          <div
                            className={`absolute top-0.5 bottom-0.5 rounded ${
                              TASK_STATUSES[task.status as keyof typeof TASK_STATUSES]?.color || 'bg-slate-500'
                            }`}
                            style={{
                              left: `${calculatePosition(task.due_date)}%`,
                              width: `${Math.max(2, calculateWidth(task.due_date, task.due_date))}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};