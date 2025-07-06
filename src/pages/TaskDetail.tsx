import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  Edit3,
  Save,
  X,
  MessageSquare,
  Send,
  UserPlus,
  Trash2
} from 'lucide-react';
import TaskComments from '@/components/tasks/TaskComments';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  project?: { name: string };
}

interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: { first_name: string; last_name: string };
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
}

const TASK_STATUSES = [
  { value: 'todo', label: 'À faire', color: 'bg-slate-500', icon: AlertCircle },
  { value: 'in_progress', label: 'En cours', color: 'bg-blue-500', icon: PlayCircle },
  { value: 'review', label: 'En révision', color: 'bg-purple-500', icon: PauseCircle },
  { value: 'done', label: 'Terminé', color: 'bg-green-500', icon: CheckCircle2 }
];

const PRIORITIES = [
  { value: 'low', label: 'Faible', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'medium', label: 'Moyenne', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { value: 'high', label: 'Élevée', color: 'text-red-600 bg-red-50 border-red-200' }
];

export default function TaskDetail() {
  const { id, projectId } = useParams<{ id: string; projectId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    estimated_hours: '',
    assignee_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        setCurrentUserId(userData.user.id);
      }
    };
    getCurrentUser();
    
    if (id) {
      loadTask();
      loadUsers();
    }
  }, [id]);

  const loadTask = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:assignee_id(first_name, last_name),
          project:project_id(name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setTask(data);
      setEditForm({
        title: data.title || '',
        description: data.description || '',
        status: data.status || '',
        priority: data.priority || '',
        estimated_hours: data.estimated_hours?.toString() || '',
        assignee_id: data.assignee_id || ''
      });

    } catch (error) {
      console.error('Error loading task:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors du chargement de la tâche"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('role', 'admin');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: editForm.title,
          description: editForm.description,
          status: editForm.status,
          priority: editForm.priority,
          assignee_id: editForm.assignee_id || null,
          estimated_hours: editForm.estimated_hours ? parseFloat(editForm.estimated_hours) : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Tâche mise à jour",
        description: "Les modifications ont été enregistrées avec succès"
      });

      setIsEditing(false);
      loadTask();

    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la mise à jour de la tâche"
      });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `Tâche marquée comme "${TASK_STATUSES.find(s => s.value === newStatus)?.label}"`
      });

      loadTask();

    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la mise à jour du statut"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Tâche non trouvée</h2>
        <Link to={`/projects/${projectId}`}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au projet
          </Button>
        </Link>
      </div>
    );
  }

  const statusConfig = TASK_STATUSES.find(s => s.value === task.status);
  const priorityConfig = PRIORITIES.find(p => p.value === task.priority);
  const StatusIcon = statusConfig?.icon || AlertCircle;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Link to={`/projects/${projectId || task.project_id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au projet
              </Button>
            </Link>
            {task.project && (
              <div className="text-sm text-muted-foreground">
                Projet: {task.project.name}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Task Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  {isEditing ? (
                    <Input
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="text-2xl font-bold"
                      placeholder="Titre de la tâche"
                    />
                  ) : (
                    <CardTitle className="text-2xl">{task.title}</CardTitle>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-2">
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig?.label}
                    </Badge>
                    {priorityConfig && (
                      <Badge variant="outline" className={priorityConfig.color}>
                        {priorityConfig.label}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                {isEditing ? (
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Description de la tâche..."
                    rows={6}
                  />
                ) : (
                  <div className="text-muted-foreground whitespace-pre-wrap">
                    {task.description || 'Aucune description'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Status Update */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {TASK_STATUSES.map((status) => {
                  const Icon = status.icon;
                  return (
                    <Button
                      key={status.value}
                      variant={task.status === status.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleStatusChange(status.value)}
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {status.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Properties */}
          <Card>
            <CardHeader>
              <CardTitle>Détails de la tâche</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="text-sm font-medium">Statut</label>
                    <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Priorité</label>
                    <Select value={editForm.priority} onValueChange={(value) => setEditForm({ ...editForm, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                   <div>
                     <label className="text-sm font-medium">Assigné à</label>
                     <Select value={editForm.assignee_id} onValueChange={(value) => setEditForm({ ...editForm, assignee_id: value })}>
                       <SelectTrigger>
                         <SelectValue placeholder="Sélectionner un utilisateur" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="">Non assigné</SelectItem>
                         {users.map((user) => (
                           <SelectItem key={user.id} value={user.id}>
                             {user.first_name} {user.last_name}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   
                   <div>
                     <label className="text-sm font-medium">Heures estimées</label>
                     <Input
                       type="number"
                       value={editForm.estimated_hours}
                       onChange={(e) => setEditForm({ ...editForm, estimated_hours: e.target.value })}
                       placeholder="0"
                     />
                   </div>
                </>
              ) : (
                <>
                  {task.assignee && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Assigné à</p>
                        <p className="font-medium">
                          {task.assignee.first_name} {task.assignee.last_name}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {task.due_date && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Échéance</p>
                        <p className="font-medium">
                          {format(new Date(task.due_date), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {task.estimated_hours && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Heures estimées</p>
                        <p className="font-medium">{task.estimated_hours}h</p>
                      </div>
                    </div>
                  )}
                  
                  {task.actual_hours && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Heures réelles</p>
                        <p className="font-medium">{task.actual_hours}h</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Progress & Time Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Temps et progression</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Temps passé</span>
                    <span>{task.actual_hours || 0}h / {task.estimated_hours || 0}h</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(100, ((task.actual_hours || 0) / (task.estimated_hours || 1)) * 100)}%` 
                      }}
                    />
                  </div>
                  {task.estimated_hours && task.actual_hours && task.actual_hours > task.estimated_hours && (
                    <p className="text-xs text-orange-600 mt-1">
                      Dépassement de {Math.round(((task.actual_hours - task.estimated_hours) / task.estimated_hours) * 100)}%
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dependencies & Workflow */}
          <Card>
            <CardHeader>
              <CardTitle>Flux de travail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    task.status === 'todo' ? 'bg-slate-400' :
                    task.status === 'in_progress' ? 'bg-blue-500' :
                    task.status === 'review' ? 'bg-purple-500' :
                    'bg-green-500'
                  }`} />
                  <span className="text-sm font-medium">
                    {TASK_STATUSES.find(s => s.value === task.status)?.label}
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Étape {TASK_STATUSES.findIndex(s => s.value === task.status) + 1}/4
                </Badge>
              </div>
              
              <div className="grid grid-cols-4 gap-1 mt-4">
                {TASK_STATUSES.map((status, index) => {
                  const currentIndex = TASK_STATUSES.findIndex(s => s.value === task.status);
                  const isCompleted = index <= currentIndex;
                  const isCurrent = index === currentIndex;
                  
                  return (
                    <div key={status.value} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                        isCompleted 
                          ? isCurrent 
                            ? 'bg-primary border-primary text-primary-foreground' 
                            : 'bg-green-500 border-green-500 text-white'
                          : 'border-muted-foreground/30'
                      }`}>
                        {isCompleted && !isCurrent ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <span className="text-xs">{index + 1}</span>
                        )}
                      </div>
                      <span className="text-xs text-center mt-1 text-muted-foreground">
                        {status.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des modifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 border-l-2 border-green-200 bg-green-50/50">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Tâche créée</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(task.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
                
                {task.updated_at !== task.created_at && (
                  <div className="flex items-start gap-3 p-3 border-l-2 border-blue-200 bg-blue-50/50">
                    <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Dernière modification</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(task.updated_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                )}
                
                {task.assignee && (
                  <div className="flex items-start gap-3 p-3 border-l-2 border-purple-200 bg-purple-50/50">
                    <User className="h-4 w-4 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Assignée à {task.assignee.first_name} {task.assignee.last_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Responsable de l'exécution
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comments Section - Style GitLab */}
          {currentUserId && <TaskComments taskId={id!} currentUserId={currentUserId} />}
        </div>
      </div>
    </div>
  );
}