
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { KanbanBoard } from '@/components/projects/KanbanBoard';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  User, 
  Building2,
  Target,
  Settings,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  owner_id?: string;
  client_company_id?: string;
  created_at: string;
  updated_at: string;
  owner?: { first_name: string; last_name: string };
  client_company?: { name: string };
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  project_id: string;
  assignee_id?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  position?: number;
  assignee?: { first_name: string; last_name: string };
}

const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planification', color: 'bg-blue-500' },
  { value: 'active', label: 'En cours', color: 'bg-green-500' },
  { value: 'on_hold', label: 'En pause', color: 'bg-yellow-500' },
  { value: 'completed', label: 'Terminé', color: 'bg-gray-500' },
  { value: 'cancelled', label: 'Annulé', color: 'bg-red-500' }
];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      
      const [projectResponse, tasksResponse] = await Promise.all([
        supabase
          .from('projects')
          .select(`
            *,
            owner:employees!projects_owner_id_fkey(first_name, last_name),
            client_company:companies(name)
          `)
          .eq('id', id)
          .single(),
        
        supabase
          .from('tasks')
          .select(`
            *,
            assignee:employees!tasks_assignee_id_fkey(first_name, last_name)
          `)
          .eq('project_id', id)
          .order('position')
      ]);

      if (projectResponse.error) throw projectResponse.error;
      if (tasksResponse.error) throw tasksResponse.error;
      
      setProject(projectResponse.data);
      setTasks(tasksResponse.data || []);

    } catch (error) {
      console.error('Error loading project:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors du chargement du projet"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const validUpdates: any = {};
      if (updates.status) validUpdates.status = updates.status;
      if (updates.priority) validUpdates.priority = updates.priority;
      if (updates.title) validUpdates.title = updates.title;
      if (updates.description !== undefined) validUpdates.description = updates.description;
      if (updates.assignee_id !== undefined) validUpdates.assignee_id = updates.assignee_id;
      if (updates.due_date !== undefined) validUpdates.due_date = updates.due_date;
      if (updates.estimated_hours !== undefined) validUpdates.estimated_hours = updates.estimated_hours;
      if (updates.actual_hours !== undefined) validUpdates.actual_hours = updates.actual_hours;
      if (updates.position !== undefined) validUpdates.position = updates.position;
      
      validUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('tasks')
        .update(validUpdates)
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, ...validUpdates } : task
      ));

      toast({
        title: "Tâche mise à jour",
        description: "Les modifications ont été enregistrées"
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la mise à jour de la tâche"
      });
    }
  };

  const handleTaskCreate = () => {
    toast({
      title: "Fonctionnalité en développement",
      description: "La création de tâche sera bientôt disponible"
    });
  };

  const handleTaskEdit = (task: Task) => {
    navigate(`/tasks/${task.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Projet non trouvé</h2>
        <Link to="/projects">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux projets
          </Button>
        </Link>
      </div>
    );
  }

  const statusConfig = PROJECT_STATUSES.find(s => s.value === project.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Link to="/projects">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-sm">
                  <div className={`w-2 h-2 rounded-full mr-2 ${statusConfig?.color}`} />
                  {statusConfig?.label}
                </Badge>
                {project.client_company && (
                  <Badge variant="outline" className="text-sm">
                    <Building2 className="h-4 w-4 mr-1" />
                    {project.client_company.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {project.description && (
            <p className="text-muted-foreground max-w-2xl">
              {project.description}
            </p>
          )}
        </div>

        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Paramètres
        </Button>
      </div>

      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du projet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {project.start_date && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date de début</p>
                  <p className="font-medium">
                    {format(new Date(project.start_date), 'dd MMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
            )}
            
            {project.end_date && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date de fin</p>
                  <p className="font-medium">
                    {format(new Date(project.end_date), 'dd MMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
            )}
            
            {project.budget && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-medium">
                    {project.budget.toLocaleString('fr-FR')} XOF
                  </p>
                </div>
              </div>
            )}
            
            {project.owner && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Chef de projet</p>
                  <p className="font-medium">
                    {project.owner.first_name} {project.owner.last_name}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Kanban Board */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Tâches du projet</h2>
            <p className="text-muted-foreground">
              Gérez et organisez les tâches de votre projet
            </p>
          </div>
          
          <Button onClick={handleTaskCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle tâche
          </Button>
        </div>
        
        <KanbanBoard
          tasks={tasks}
          onTaskUpdate={handleTaskUpdate}
          onTaskCreate={handleTaskCreate}
          onTaskEdit={handleTaskEdit}
        />
      </div>
    </div>
  );
}
