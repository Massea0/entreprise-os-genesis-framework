import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Users, 
  Target, 
  Clock, 
  DollarSign,
  FolderOpen,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  User,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { WorkOrganizer } from '@/components/ai/WorkOrganizer';
import { KanbanBoard } from '@/components/projects/KanbanBoard';
import { ProjectPlanGenerator } from '@/components/projects/ProjectPlanGenerator';
import { TaskBulkCreator } from '@/components/projects/TaskBulkCreator';

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
  custom_fields?: any;
  tasks?: Task[];
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
  created_at: string;
  updated_at: string;
  assignee?: { first_name: string; last_name: string };
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  user_id?: string;
}

interface Company {
  id: string;
  name: string;
}

const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planification', color: 'bg-blue-500' },
  { value: 'active', label: 'En cours', color: 'bg-green-500' },
  { value: 'on_hold', label: 'En pause', color: 'bg-yellow-500' },
  { value: 'completed', label: 'Terminé', color: 'bg-gray-500' },
  { value: 'cancelled', label: 'Annulé', color: 'bg-red-500' }
];

const TASK_STATUSES = [
  { value: 'todo', label: 'À faire', color: 'bg-slate-500' },
  { value: 'in_progress', label: 'En cours', color: 'bg-blue-500' },
  { value: 'review', label: 'En révision', color: 'bg-purple-500' },
  { value: 'done', label: 'Terminé', color: 'bg-green-500' }
];

const PRIORITIES = [
  { value: 'low', label: 'Faible', color: 'text-blue-600' },
  { value: 'medium', label: 'Moyenne', color: 'text-yellow-600' },
  { value: 'high', label: 'Élevée', color: 'text-red-600' }
];

// Composant pour une carte de projet
const ProjectCard = ({ 
  project, 
  onEdit, 
  onViewTasks 
}: { 
  project: Project; 
  onEdit: (project: Project) => void;
  onViewTasks: (project: Project) => void;
}) => {
  const statusConfig = PROJECT_STATUSES.find(s => s.value === project.status);
  const tasksCount = project.tasks?.length || 0;
  const completedTasks = project.tasks?.filter(t => t.status === 'done').length || 0;
  const progress = tasksCount > 0 ? (completedTasks / tasksCount) * 100 : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <div className={`w-2 h-2 rounded-full mr-2 ${statusConfig?.color}`} />
                {statusConfig?.label}
              </Badge>
              {project.client_company && (
                <Badge variant="outline" className="text-xs">
                  <Building2 className="h-3 w-3 mr-1" />
                  {project.client_company.name}
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onEdit(project)}>
            <User className="h-4 w-4" />
          </Button>
        </div>
        
        {project.description && (
          <CardDescription className="text-sm line-clamp-2">
            {project.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Dates et budget */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {project.start_date && (
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">
                {format(new Date(project.start_date), 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
          )}
          
          {project.budget && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">
                {project.budget.toLocaleString('fr-FR')} XOF
              </span>
            </div>
          )}
        </div>

        {/* Barre de progression des tâches */}
        {tasksCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{completedTasks}/{tasksCount} tâches</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onViewTasks(project)} className="flex-1">
            <Target className="h-4 w-4 mr-2" />
            Tâches ({tasksCount})
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(project)}>
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant pour le formulaire de projet
const ProjectForm = ({ 
  project, 
  companies, 
  employees, 
  onSave, 
  onCancel 
}: {
  project?: Project;
  companies: Company[];
  employees: Employee[];
  onSave: (projectData: any) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'planning',
    start_date: project?.start_date ? new Date(project.start_date) : undefined,
    end_date: project?.end_date ? new Date(project.end_date) : undefined,
    budget: project?.budget?.toString() || '',
    client_company_id: project?.client_company_id || '',
    owner_id: project?.owner_id || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      start_date: formData.start_date?.toISOString(),
      end_date: formData.end_date?.toISOString()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom du projet *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status.color}`} />
                    {status.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date de début</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.start_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.start_date ? (
                  format(formData.start_date, "dd MMM yyyy", { locale: fr })
                ) : (
                  <span>Sélectionner une date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.start_date}
                onSelect={(date) => setFormData({ ...formData, start_date: date })}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Date de fin</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.end_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.end_date ? (
                  format(formData.end_date, "dd MMM yyyy", { locale: fr })
                ) : (
                  <span>Sélectionner une date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.end_date}
                onSelect={(date) => setFormData({ ...formData, end_date: date })}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budget">Budget (XOF)</Label>
          <Input
            id="budget"
            type="number"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_company_id">Client</Label>
          <Select 
            value={formData.client_company_id} 
            onValueChange={(value) => setFormData({ ...formData, client_company_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un client" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="owner_id">Chef de projet</Label>
        <Select 
          value={formData.owner_id} 
          onValueChange={(value) => setFormData({ ...formData, owner_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un chef de projet" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={emp.user_id || emp.id}>
                {emp.first_name} {emp.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {project ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
};

// Composant pour la gestion des tâches
const TaskManagement = ({ project }: { project: Project }) => {
  const [tasks, setTasks] = useState<Task[]>(project.tasks || []);
  const [loading, setLoading] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const { toast } = useToast();

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:assignee_id(first_name, last_name)
        `)
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors du chargement des tâches"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [project.id]);

  const handleSaveTask = async (taskData: any) => {
    try {
      if (editingTask) {
        const { error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', editingTask.id);

        if (error) throw error;
        toast({ title: "Tâche modifiée", description: "La tâche a été modifiée avec succès" });
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert([{ ...taskData, project_id: project.id }]);

        if (error) throw error;
        toast({ title: "Tâche créée", description: "La nouvelle tâche a été créée avec succès" });
      }

      setShowTaskForm(false);
      setEditingTask(undefined);
      loadTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de l'enregistrement de la tâche"
      });
    }
  };

  const getStatusColor = (status: string) => {
    const config = TASK_STATUSES.find(s => s.value === status);
    return config?.color || 'bg-gray-500';
  };

  const getPriorityColor = (priority: string) => {
    const config = PRIORITIES.find(p => p.value === priority);
    return config?.color || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tâches - {project.name}</h2>
          <p className="text-muted-foreground">{tasks.length} tâche(s) au total</p>
        </div>

        <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTask(undefined)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Tâche
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}
              </DialogTitle>
            </DialogHeader>
            <TaskForm
              task={editingTask}
              onSave={handleSaveTask}
              onCancel={() => setShowTaskForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des tâches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{task.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(task.status)}`} />
                      {TASK_STATUSES.find(s => s.value === task.status)?.label}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                      {PRIORITIES.find(p => p.value === task.priority)?.label}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                  setEditingTask(task);
                  setShowTaskForm(true);
                }}>
                  <User className="h-4 w-4" />
                </Button>
              </div>
              
              {task.description && (
                <CardDescription className="text-sm line-clamp-2">
                  {task.description}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="space-y-3">
              {task.assignee && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{task.assignee.first_name} {task.assignee.last_name}</span>
                </div>
              )}
              
              {task.due_date && (
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(task.due_date), 'dd MMM yyyy', { locale: fr })}</span>
                </div>
              )}
              
              {task.estimated_hours && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{task.estimated_hours}h estimées</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {tasks.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune tâche</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par créer une tâche pour ce projet
            </p>
            <Button onClick={() => setShowTaskForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une tâche
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Composant pour le formulaire de tâche
const TaskForm = ({ 
  task, 
  onSave, 
  onCancel 
}: {
  task?: Task;
  onSave: (taskData: any) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    due_date: task?.due_date ? new Date(task.due_date) : undefined,
    estimated_hours: task?.estimated_hours?.toString() || '',
    assignee_id: task?.assignee_id || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
      due_date: formData.due_date?.toISOString(),
      assignee_id: formData.assignee_id || null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titre *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status.color}`} />
                    {status.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priorité</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((priority) => (
                <SelectItem key={priority.value} value={priority.value}>
                  <span className={priority.color}>{priority.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date d'échéance</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.due_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.due_date ? (
                  format(formData.due_date, "dd MMM yyyy", { locale: fr })
                ) : (
                  <span>Sélectionner une date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.due_date}
                onSelect={(date) => setFormData({ ...formData, due_date: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated_hours">Heures estimées</Label>
          <Input
            id="estimated_hours"
            type="number"
            value={formData.estimated_hours}
            onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {task ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger tous les données en parallèle
      const [projectsResponse, companiesResponse, employeesResponse] = await Promise.all([
        supabase
          .from('projects')
          .select(`
            *,
            owner:owner_id(first_name, last_name),
            client_company:client_company_id(name),
            tasks(*)
          `)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('companies')
          .select('id, name')
          .order('name'),
        
        supabase
          .from('employees')
          .select('id, first_name, last_name, user_id')
          .eq('employment_status', 'active')
          .order('first_name')
      ]);

      if (projectsResponse.error) throw projectsResponse.error;
      if (companiesResponse.error) throw companiesResponse.error;
      if (employeesResponse.error) throw employeesResponse.error;

      setProjects(projectsResponse.data || []);
      setCompanies(companiesResponse.data || []);
      setEmployees(employeesResponse.data || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors du chargement des données"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async (projectData: any) => {
    try {
      if (editingProject) {
        // Modifier un projet existant
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProject.id);

        if (error) throw error;

        toast({
          title: "Projet modifié",
          description: "Le projet a été modifié avec succès"
        });
      } else {
        // Créer un nouveau projet
        const { error } = await supabase
          .from('projects')
          .insert([projectData]);

        if (error) throw error;

        toast({
          title: "Projet créé",
          description: "Le nouveau projet a été créé avec succès"
        });
      }

      setShowProjectForm(false);
      setEditingProject(undefined);
      loadData();
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de l'enregistrement du projet"
      });
    }
  };

  const getProjectStats = () => {
    const total = projects.length;
    const active = projects.filter(p => p.status === 'active').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

    return { total, active, completed, totalBudget };
  };

  const stats = getProjectStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Projets</h1>
          <p className="text-muted-foreground">
            Gestion des projets et suivi des tâches
          </p>
        </div>
        
        <Dialog open={showProjectForm} onOpenChange={setShowProjectForm}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProject(undefined)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Projet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProject ? 'Modifier le projet' : 'Nouveau projet'}
              </DialogTitle>
              <DialogDescription>
                {editingProject 
                  ? 'Modifiez les informations du projet'
                  : 'Créez un nouveau projet pour votre équipe'
                }
              </DialogDescription>
            </DialogHeader>
            <ProjectForm
              project={editingProject}
              companies={companies}
              employees={employees}
              onSave={handleSaveProject}
              onCancel={() => setShowProjectForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total projets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <PlayCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Terminés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {stats.totalBudget.toLocaleString('fr-FR')}
                </p>
                <p className="text-sm text-muted-foreground">Budget total (XOF)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation par onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <FolderOpen className="h-4 w-4 mr-2" />
            Projets
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <Target className="h-4 w-4 mr-2" />
            Tâches
          </TabsTrigger>
          <TabsTrigger value="ai_organization">
            <Users className="h-4 w-4 mr-2" />
            IA Organisation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Liste des projets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={(project) => {
                  setEditingProject(project);
                  setShowProjectForm(true);
                }}
                onViewTasks={(project) => {
                  setSelectedProject(project);
                  setActiveTab('tasks');
                }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          {selectedProject ? (
            <TaskManagement project={selectedProject} />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Sélectionner un projet</h3>
                <p className="text-muted-foreground">
                  Choisissez un projet pour voir ses tâches
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai_organization" className="space-y-6">
          <WorkOrganizer projectId={selectedProject?.id} />
        </TabsContent>
      </Tabs>

      {projects.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun projet</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par créer votre premier projet
            </p>
            <Button onClick={() => setShowProjectForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un projet
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}