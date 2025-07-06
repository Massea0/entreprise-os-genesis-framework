import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AssigneeSelector from '@/components/tasks/AssigneeSelector';
import { 
  Plus, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Circle, 
  MoreHorizontal,
  MessageSquare,
  Paperclip,
  TrendingUp,
  Calendar,
  Flag,
  Zap,
  Target,
  Timer
} from 'lucide-react';
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
  position?: number;
  labels?: string[];
  complexity_score?: number;
  custom_fields?: any;
  assignee?: {
    first_name: string;
    last_name: string;
  };
  comments_count?: number;
  attachments_count?: number;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
  icon: any;
  limit?: number;
}

interface EnhancedKanbanBoardProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onTaskCreate: () => void;
  onTaskEdit: (task: Task) => void;
  projectId: string;
}

const COLUMN_CONFIG = {
  todo: {
    title: 'À faire',
    color: 'bg-slate-50 border-slate-200',
    headerColor: 'bg-slate-100 text-slate-700',
    icon: Circle,
    limit: 10
  },
  in_progress: {
    title: 'En cours',
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'bg-blue-100 text-blue-700',
    icon: Clock,
    limit: 5
  },
  review: {
    title: 'En révision',
    color: 'bg-yellow-50 border-yellow-200',
    headerColor: 'bg-yellow-100 text-yellow-700',
    icon: AlertCircle,
    limit: 8
  },
  done: {
    title: 'Terminé',
    color: 'bg-green-50 border-green-200',
    headerColor: 'bg-green-100 text-green-700',
    icon: CheckCircle2,
    limit: undefined
  }
};

const PRIORITY_CONFIG = {
  low: { label: 'Faible', color: 'bg-gray-100 text-gray-600', icon: '●' },
  medium: { label: 'Moyen', color: 'bg-yellow-100 text-yellow-600', icon: '●●' },
  high: { label: 'Élevé', color: 'bg-orange-100 text-orange-600', icon: '●●●' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-600', icon: '🔥' }
};

function EnhancedKanbanBoard({ 
  tasks, 
  onTaskUpdate, 
  onTaskCreate, 
  onTaskEdit, 
  projectId 
}: EnhancedKanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [commentsCount, setCommentsCount] = useState<{[key: string]: number}>({});
  const { toast } = useToast();

  useEffect(() => {
    organizeTasksIntoColumns();
    loadCommentsCount();
  }, [tasks]);

  const organizeTasksIntoColumns = () => {
    const tasksByStatus = tasks.reduce((acc, task) => {
      if (!acc[task.status]) acc[task.status] = [];
      acc[task.status].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    const newColumns: Column[] = Object.entries(COLUMN_CONFIG).map(([status, config]) => ({
      id: status,
      title: config.title,
      tasks: (tasksByStatus[status] || []).sort((a, b) => (a.position || 0) - (b.position || 0)),
      color: config.color,
      icon: config.icon
    }));

    setColumns(newColumns);
  };

  const loadCommentsCount = async () => {
    try {
      const { data: counts } = await supabase
        .from('task_comments')
        .select('task_id')
        .in('task_id', tasks.map(t => t.id));

      const countMap = (counts || []).reduce((acc, comment) => {
        acc[comment.task_id] = (acc[comment.task_id] || 0) + 1;
        return acc;
      }, {} as {[key: string]: number});

      setCommentsCount(countMap);
    } catch (error) {
      console.error('Error loading comments count:', error);
    }
  };

  const handleDragStart = useCallback((start: any) => {
    setIsDragging(true);
    setDraggedTask(start.draggableId);
  }, []);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    setIsDragging(false);
    setDraggedTask(null);
    
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);
    
    if (!sourceColumn || !destColumn) return;

    const task = sourceColumn.tasks.find(t => t.id === draggableId);
    if (!task) return;

    // Animations optimistes - Update UI immédiatement
    const newColumns = columns.map(col => {
      if (col.id === source.droppableId) {
        const newTasks = [...col.tasks];
        newTasks.splice(source.index, 1);
        return { ...col, tasks: newTasks };
      }
      if (col.id === destination.droppableId) {
        const newTasks = [...col.tasks];
        const updatedTask = { ...task, status: destination.droppableId };
        newTasks.splice(destination.index, 0, updatedTask);
        return { ...col, tasks: newTasks };
      }
      return col;
    });

    setColumns(newColumns);

    try {
      // Mettre à jour en base de données
      await onTaskUpdate(draggableId, {
        status: destination.droppableId,
        position: destination.index
      });

      // Réorganiser les positions dans la colonne de destination
      const destinationTasks = newColumns.find(col => col.id === destination.droppableId)?.tasks || [];
      await Promise.all(
        destinationTasks.map((task, index) => 
          onTaskUpdate(task.id, { position: index })
        )
      );

      // Animation de succès subtile
      const taskElement = document.querySelector(`[data-rbd-draggable-id="${draggableId}"]`);
      if (taskElement) {
        taskElement.classList.add('animate-pulse');
        setTimeout(() => {
          taskElement.classList.remove('animate-pulse');
        }, 300);
      }

    } catch (error) {
      // Rollback en cas d'erreur
      organizeTasksIntoColumns();
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors du déplacement de la tâche"
      });
    }
  }, [columns, onTaskUpdate, toast]);

  const getPriorityInfo = (priority: string) => 
    PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;

  const getColumnConfig = (status: string) => 
    COLUMN_CONFIG[status as keyof typeof COLUMN_CONFIG] || COLUMN_CONFIG.todo;

  const renderTask = (task: Task, index: number) => {
    const priorityInfo = getPriorityInfo(task.priority);
    const isOverdue = task.due_date && new Date(task.due_date) < new Date();
    const taskCommentsCount = commentsCount[task.id] || 0;

    return (
      <Draggable key={task.id} draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`mb-3 transform transition-all duration-200 ease-out ${
              snapshot.isDragging 
                ? 'rotate-2 scale-105 shadow-2xl z-50' 
                : 'hover:scale-[1.02] hover:shadow-md'
            } ${draggedTask === task.id ? 'opacity-50' : ''}`}
            style={{
              ...provided.draggableProps.style,
              transformOrigin: 'center',
            }}
          >
            <Card 
              className={`cursor-pointer border-l-4 transition-all duration-200 ${
                snapshot.isDragging 
                  ? 'border-l-primary bg-white shadow-2xl' 
                  : 'border-l-transparent hover:border-l-primary/50 hover:bg-muted/30'
              } ${isOverdue ? 'border-red-200 bg-red-50/50' : ''}`}
              onClick={() => onTaskEdit(task)}
            >
              <CardContent className="p-4">
                {/* Header avec priorité et labels */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-1.5 py-0.5 ${priorityInfo.color} border-0`}
                    >
                      {priorityInfo.icon}
                    </Badge>
                    
                    {task.complexity_score && task.complexity_score > 3 && (
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600">
                        <Target className="h-3 w-3 mr-1" />
                        Complexe
                      </Badge>
                    )}
                    
                    {task.labels && task.labels.map((label: string) => (
                      <Badge key={label} variant="secondary" className="text-xs">
                        {label}
                      </Badge>
                    ))}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </div>

                {/* Titre et description */}
                <div className="mb-3">
                  <h4 className="font-medium text-sm leading-tight mb-1 line-clamp-2">
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Métadonnées */}
                <div className="space-y-2">
                  {/* Date et estimation */}
                  {(task.due_date || task.estimated_hours) && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {task.due_date && (
                        <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(new Date(task.due_date), 'dd MMM', { locale: fr })}
                          </span>
                          {isOverdue && <AlertCircle className="h-3 w-3 text-red-500" />}
                        </div>
                      )}
                      
                      {task.estimated_hours && (
                        <div className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          <span>{task.estimated_hours}h</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer avec assignee et stats */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {task.assignee ? (
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {task.assignee.first_name[0]}{task.assignee.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                          <Plus className="h-3 w-3 text-muted-foreground/50" />
                        </div>
                      )}
                      
                      <AssigneeSelector
                        taskId={task.id}
                        currentAssigneeId={task.assignee_id}
                        onAssign={async (userId, reason) => {
                          await onTaskUpdate(task.id, { assignee_id: userId });
                        }}
                        taskSkills={task.custom_fields?.requiredSkills || []}
                        taskComplexity={task.complexity_score}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {taskCommentsCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          <span>{taskCommentsCount}</span>
                        </div>
                      )}
                      
                      {task.custom_fields?.attachments?.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Paperclip className="h-3 w-3" />
                          <span>{task.custom_fields.attachments.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Draggable>
    );
  };

  const renderColumn = (column: Column) => {
    const config = getColumnConfig(column.id);
    const isOverLimit = config.limit && column.tasks.length > config.limit;
    const IconComponent = config.icon;

    return (
      <div key={column.id} className="flex-1 min-w-[300px]">
        <Card className={`h-full ${config.color} border-2 transition-all duration-200`}>
          <CardHeader className={`pb-3 ${config.headerColor} rounded-t-lg border-b`}>
            <CardTitle className="flex items-center justify-between text-sm font-semibold">
              <div className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                <span>{column.title}</span>
                <Badge variant="secondary" className="h-5 px-2 text-xs font-medium">
                  {column.tasks.length}
                </Badge>
                {isOverLimit && (
                  <Badge variant="destructive" className="h-5 px-2 text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Limite
                  </Badge>
                )}
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 hover:bg-white/50"
                onClick={onTaskCreate}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-3">
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[200px] transition-all duration-200 rounded-lg ${
                    snapshot.isDraggingOver 
                      ? 'bg-primary/5 border-2 border-dashed border-primary/30 scale-[1.02]' 
                      : ''
                  } ${isDragging && !snapshot.isDraggingOver ? 'opacity-60' : ''}`}
                >
                  <div className="space-y-3">
                    {column.tasks.map((task, index) => renderTask(task, index))}
                  </div>
                  {provided.placeholder}
                  
                  {/* Zone de drop vide */}
                  {column.tasks.length === 0 && (
                    <div className={`h-32 flex items-center justify-center border-2 border-dashed rounded-lg transition-all duration-200 ${
                      snapshot.isDraggingOver 
                        ? 'border-primary/50 bg-primary/5' 
                        : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                    }`}>
                      <div className="text-center text-muted-foreground">
                        <IconComponent className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Glissez une tâche ici</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="w-full">
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(renderColumn)}
        </div>
      </DragDropContext>
      
      {/* Overlay de drag global */}
      {isDragging && (
        <div className="fixed inset-0 bg-black/5 backdrop-blur-[1px] z-40 pointer-events-none transition-all duration-200" />
      )}
    </div>
  );
}

export default EnhancedKanbanBoard;