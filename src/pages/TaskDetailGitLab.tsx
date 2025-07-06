import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import TaskComments from '@/components/tasks/TaskComments';
import AssigneeSelector from '@/components/tasks/AssigneeSelector';
import MermaidTaskViewer from '@/components/diagrams/MermaidTaskViewer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
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
  GitMerge,
  Tag,
  Timer,
  TrendingUp,
  Users,
  Target,
  Paperclip,
  Sparkles,
  Layout,
  CheckSquare
} from 'lucide-react';

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
  labels?: string[];
  complexity_score?: number;
  time_tracking?: any;
  assignee?: { first_name: string; last_name: string };
  project?: { name: string };
}

const TASK_STATUSES = [
  { value: 'todo', label: 'À faire', color: 'bg-slate-500 hover:bg-slate-600', icon: AlertCircle },
  { value: 'in_progress', label: 'En cours', color: 'bg-blue-500 hover:bg-blue-600', icon: PlayCircle },
  { value: 'review', label: 'En révision', color: 'bg-purple-500 hover:bg-purple-600', icon: PauseCircle },
  { value: 'done', label: 'Terminé', color: 'bg-green-500 hover:bg-green-600', icon: CheckCircle2 }
];

const PRIORITIES = [
  { value: 'low', label: 'Faible', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'medium', label: 'Moyenne', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { value: 'high', label: 'Élevée', color: 'text-red-600 bg-red-50 border-red-200' }
];

export default function TaskDetailGitLab() {
  const { id, projectId } = useParams<{ id: string; projectId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'detail' | 'planning'>('detail');
  const [enhancing, setEnhancing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    estimated_hours: '',
    due_date: '',
    labels: '' as string
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
    }
  }, [id]);

  const loadTask = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          project:projects(name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Charger l'assignee séparément
      let assigneeData = null;
      if (data.assignee_id) {
        try {
          const { data: employeeData } = await supabase
            .from('employees')
            .select('first_name, last_name')
            .eq('user_id', data.assignee_id)
            .maybeSingle();
          
          if (employeeData) {
            assigneeData = employeeData;
          }
        } catch (error) {
          console.log('Assignee not found:', data.assignee_id);
        }
      }
      
      const taskWithAssignee = {
        ...data,
        assignee: assigneeData,
        labels: Array.isArray(data.labels) ? (data.labels as string[]) : []
      } as Task;
      
      setTask(taskWithAssignee);
      setEditForm({
        title: data.title || '',
        description: data.description || '',
        status: data.status || '',
        priority: data.priority || '',
        estimated_hours: data.estimated_hours?.toString() || '',
        due_date: data.due_date || '',
        labels: Array.isArray(data.labels) ? (data.labels as string[]).join(', ') : ''
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

  const handleSave = async () => {
    try {
      const labels = editForm.labels
        .split(',')
        .map(label => label.trim())
        .filter(label => label.length > 0);

      const { error } = await supabase
        .from('tasks')
        .update({
          title: editForm.title,
          description: editForm.description,
          status: editForm.status,
          priority: editForm.priority,
          estimated_hours: editForm.estimated_hours ? parseFloat(editForm.estimated_hours) : null,
          due_date: editForm.due_date || null,
          labels,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Tâche mise à jour",
        description: "Les modifications ont été enregistrées"
      });

      setIsEditing(false);
      loadTask();

    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la mise à jour"
      });
    }
  };

  const handleAssign = async (userId: string | null, reason?: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          assignee_id: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      loadTask();
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error;
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

  const handleEnhanceTask = async (action: string) => {
    if (!id) return;
    
    setEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-task', {
        body: { taskId: id, action }
      });

      if (error) throw error;

      toast({
        title: "Tâche améliorée",
        description: "Les suggestions IA ont été générées avec succès"
      });

      // Afficher les résultats selon le type
      console.log('Enhancement result:', data);
      
    } catch (error) {
      console.error('Erreur lors de l\'amélioration:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'améliorer la tâche"
      });
    } finally {
      setEnhancing(false);
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
        <Link to={`/projects/${projectId || task?.project_id}`}>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header GitLab Style */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={`/projects/${projectId || task.project_id}`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </Button>
              </Link>
              {task.project && (
                <div className="text-sm text-muted-foreground">
                  <Link to={`/projects/${task.project_id}`} className="hover:text-primary">
                    {task.project.name}
                  </Link>
                  <span className="mx-2">•</span>
                  <span>Tâche #{task.id.slice(-8).toUpperCase()}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                  <Edit3 className="h-4 w-4" />
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
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Toggle View Mode */}
        <div className="mb-6">
          <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="detail" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Vue Détail
              </TabsTrigger>
              <TabsTrigger value="planning" className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Vue Planning
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {viewMode === 'detail' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content - 3 colonnes */}
            <div className="lg:col-span-3 space-y-6">
            {/* Title and Description */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    {isEditing ? (
                      <Input
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="text-2xl font-bold border-0 p-0 h-auto text-gray-900"
                        placeholder="Titre de la tâche"
                      />
                    ) : (
                      <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
                    )}
                  </div>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Créé le {format(new Date(task.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                    <span>•</span>
                    <span>Mis à jour le {format(new Date(task.updated_at), 'dd MMM yyyy', { locale: fr })}</span>
                  </div>

                  {/* Labels */}
                  {task.labels && task.labels.length > 0 && !isEditing && (
                    <div className="flex flex-wrap gap-2">
                      {task.labels.map((label, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          <Tag className="h-3 w-3" />
                          {label}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {isEditing && (
                    <div>
                      <label className="text-sm font-medium">Labels (séparés par des virgules)</label>
                      <Input
                        value={editForm.labels}
                        onChange={(e) => setEditForm({ ...editForm, labels: e.target.value })}
                        placeholder="frontend, urgent, bug..."
                        className="mt-1"
                      />
                    </div>
                  )}

                  <Separator />

                  {/* Description */}
                  <div>
                    <h3 className="font-semibold mb-3">Description</h3>
                    {isEditing ? (
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Décrivez la tâche en détail..."
                        rows={8}
                        className="min-h-[200px]"
                      />
                    ) : (
                      <div className="prose max-w-none">
                        {task.description ? (
                          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                            {task.description}
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic">Aucune description</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitMerge className="h-5 w-5" />
                  Actions rapides
                </CardTitle>
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
                        className={`gap-2 transition-all ${task.status === status.value ? status.color : ''}`}
                      >
                        <Icon className="h-4 w-4" />
                        {status.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Comments - Style GitLab */}
            {currentUserId && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Discussion
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <TaskComments taskId={id!} currentUserId={currentUserId} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - 1 colonne */}
          <div className="space-y-4">
            {/* Task Properties */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Détails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">STATUT</label>
                  <div className="mt-1">
                    {isEditing ? (
                      <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              <div className="flex items-center gap-2">
                                <status.icon className="h-3 w-3" />
                                {status.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary" className="gap-2">
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig?.label}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">PRIORITÉ</label>
                  <div className="mt-1">
                    {isEditing ? (
                      <Select value={editForm.priority} onValueChange={(value) => setEditForm({ ...editForm, priority: value })}>
                        <SelectTrigger className="h-8 text-sm">
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
                    ) : (
                      priorityConfig && (
                        <Badge variant="outline" className={priorityConfig.color}>
                          {priorityConfig.label}
                        </Badge>
                      )
                    )}
                  </div>
                </div>

                {/* Assignee */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">ASSIGNÉ À</label>
                  <div className="mt-1">
                    <AssigneeSelector
                      taskId={id!}
                      currentAssigneeId={task.assignee_id}
                      onAssign={handleAssign}
                      taskSkills={task.labels || []}
                      taskComplexity={task.complexity_score}
                      disabled={isEditing}
                    />
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">ÉCHÉANCE</label>
                  <div className="mt-1">
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editForm.due_date}
                        onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                        className="h-8 text-sm"
                      />
                    ) : task.due_date ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(task.due_date), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Non définie</span>
                    )}
                  </div>
                </div>

                {/* Estimated Hours */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">ESTIMATION</label>
                  <div className="mt-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editForm.estimated_hours}
                          onChange={(e) => setEditForm({ ...editForm, estimated_hours: e.target.value })}
                          placeholder="0"
                          className="h-8 text-sm"
                          min="0"
                          step="0.5"
                        />
                        <span className="text-xs text-muted-foreground">h</span>
                      </div>
                    ) : task.estimated_hours ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {task.estimated_hours}h estimées
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Non estimé</span>
                    )}
                  </div>
                </div>

                {/* Time Tracking */}
                {task.actual_hours && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">TEMPS PASSÉ</label>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      {task.actual_hours}h réalisées
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Stats */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Activité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Créé</span>
                  <span>{format(new Date(task.created_at), 'dd/MM/yy', { locale: fr })}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Modifié</span>
                  <span>{format(new Date(task.updated_at), 'dd/MM/yy', { locale: fr })}</span>
                </div>
              </CardContent>
            </Card>
            </div>
          </div>
        ) : (
          /* Vue Planning Style Notion */
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Vue Planning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Métriques rapides */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Timer className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Estimation</span>
                    </div>
                    <p className="text-2xl font-bold">{task.estimated_hours || 0}h</p>
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Temps passé</span>
                    </div>
                    <p className="text-2xl font-bold">{task.actual_hours || 0}h</p>
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Priorité</span>
                    </div>
                    <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>
                      {task.priority}
                    </Badge>
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckSquare className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Statut</span>
                    </div>
                    <Badge variant="outline">{task.status}</Badge>
                  </div>
                </div>

                {/* Visualisation Mermaid IA */}
                <MermaidTaskViewer taskId={id!} taskTitle={task.title} />

                {/* Actions d'amélioration IA */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Améliorations IA
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => handleEnhanceTask('enhance_description')}
                      disabled={enhancing}
                      className="justify-start h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="font-medium">Améliorer description</div>
                        <div className="text-sm text-muted-foreground">Rendre plus claire et détaillée</div>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => handleEnhanceTask('suggest_subtasks')}
                      disabled={enhancing}
                      className="justify-start h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="font-medium">Suggérer sous-tâches</div>
                        <div className="text-sm text-muted-foreground">Décomposer en étapes</div>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => handleEnhanceTask('estimate_effort')}
                      disabled={enhancing}
                      className="justify-start h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="font-medium">Estimer l'effort</div>
                        <div className="text-sm text-muted-foreground">Calculer le temps nécessaire</div>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => handleEnhanceTask('suggest_acceptance_criteria')}
                      disabled={enhancing}
                      className="justify-start h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="font-medium">Critères d'acceptation</div>
                        <div className="text-sm text-muted-foreground">Définir les conditions de succès</div>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Timeline / Échéances */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Planification</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date de début</Label>
                      <div className="p-3 bg-muted/50 rounded-md">
                        {task.created_at ? new Date(task.created_at).toLocaleDateString('fr-FR') : 'Non définie'}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Échéance</Label>
                      <div className="p-3 bg-muted/50 rounded-md">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR') : 'Non définie'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assignation et ressources */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Ressources</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Assigné à</Label>
                      <div className="p-3 bg-muted/50 rounded-md">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {task.assignee.first_name?.[0]}{task.assignee.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span>{task.assignee.first_name} {task.assignee.last_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Non assigné</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Projet</Label>
                      <div className="p-3 bg-muted/50 rounded-md">
                        {task.project?.name || 'Aucun projet'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}