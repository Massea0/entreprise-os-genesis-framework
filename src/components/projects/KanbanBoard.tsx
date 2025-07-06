import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  Plus, 
  MoreHorizontal, 
  User, 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Circle,
  PlayCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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

interface KanbanBoardProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onTaskCreate: () => void;
  onTaskEdit: (task: Task) => void;
}

const KANBAN_COLUMNS = [
  { 
    id: 'todo', 
    title: 'À faire', 
    color: 'bg-slate-100 border-slate-200',
    icon: Circle,
    textColor: 'text-slate-700'
  },
  { 
    id: 'in_progress', 
    title: 'En cours', 
    color: 'bg-blue-100 border-blue-200',
    icon: PlayCircle,
    textColor: 'text-blue-700'
  },
  { 
    id: 'blocked', 
    title: 'Bloqué', 
    color: 'bg-red-100 border-red-200',
    icon: AlertCircle,
    textColor: 'text-red-700'
  },
  { 
    id: 'done', 
    title: 'Terminé', 
    color: 'bg-green-100 border-green-200',
    icon: CheckCircle2,
    textColor: 'text-green-700'
  }
];

const PRIORITY_CONFIG = {
  low: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Faible' },
  medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Moyenne' },
  high: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Élevée' },
  urgent: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Urgente' }
};

// Composant pour une carte de tâche
const TaskCard: React.FC<{
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
}> = ({ task, index, onEdit }) => {
  const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;
  
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
  
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "mb-3 cursor-pointer hover:shadow-md transition-all duration-200",
            snapshot.isDragging && "rotate-2 shadow-lg scale-105",
            isOverdue && "border-red-300 bg-red-50"
          )}
          onClick={() => onEdit(task)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-sm font-medium line-clamp-2 flex-1">
                {task.title}
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}>
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {task.description}
              </p>
            )}
          </CardHeader>
          
          <CardContent className="pt-0 space-y-2">
            {/* Priorité */}
            <Badge 
              variant="outline" 
              className={cn("text-xs", priorityConfig.color)}
            >
              {priorityConfig.label}
            </Badge>
            
            {/* Informations complémentaires */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                {task.estimated_hours && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{task.estimated_hours}h</span>
                  </div>
                )}
                
                {task.due_date && (
                  <div className={cn(
                    "flex items-center gap-1",
                    isOverdue && "text-red-600 font-medium"
                  )}>
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(task.due_date), 'dd/MM', { locale: fr })}</span>
                  </div>
                )}
              </div>
              
              {/* Assigné */}
              {task.assignee && (
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(task.assignee.first_name, task.assignee.last_name)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};

// Composant pour une colonne Kanban
const KanbanColumn: React.FC<{
  column: typeof KANBAN_COLUMNS[0];
  tasks: Task[];
  onTaskCreate: () => void;
  onTaskEdit: (task: Task) => void;
}> = ({ column, tasks, onTaskCreate, onTaskEdit }) => {
  const IconComponent = column.icon;
  
  return (
    <div className={cn("rounded-lg border-2 border-dashed p-4 min-h-[600px]", column.color)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IconComponent className={cn("h-4 w-4", column.textColor)} />
          <h3 className={cn("font-medium", column.textColor)}>
            {column.title}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onTaskCreate}
          className={cn("h-6 w-6 p-0", column.textColor)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "min-h-[500px] transition-colors",
              snapshot.isDraggingOver && "bg-primary/5 rounded-md"
            )}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onEdit={onTaskEdit}
              />
            ))}
            {provided.placeholder}
            
            {/* Zone de drop vide */}
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <IconComponent className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Aucune tâche
                </p>
                <p className="text-xs text-muted-foreground/75">
                  Glissez une tâche ici
                </p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

// Composant principal Kanban
export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onTaskUpdate,
  onTaskCreate,
  onTaskEdit
}) => {
  const [isDragging, setIsDragging] = useState(false);

  // Organiser les tâches par colonne
  const tasksByStatus = KANBAN_COLUMNS.reduce((acc, column) => {
    acc[column.id] = tasks
      .filter(task => task.status === column.id)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    return acc;
  }, {} as Record<string, Task[]>);

  // Gérer le drag & drop
  const onDragEnd = useCallback(async (result: DropResult) => {
    setIsDragging(false);
    
    const { destination, source, draggableId } = result;

    // Pas de destination ou même position
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    try {
      // Mettre à jour le statut de la tâche
      if (destination.droppableId !== source.droppableId) {
        await onTaskUpdate(draggableId, {
          status: destination.droppableId,
          position: destination.index
        });
      } else {
        // Juste changer la position dans la même colonne
        await onTaskUpdate(draggableId, {
          position: destination.index
        });
      }
    } catch (error) {
      console.error('Erreur lors du déplacement de la tâche:', error);
    }
  }, [onTaskUpdate]);

  const onDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  return (
    <div className="h-full">
      <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
          {KANBAN_COLUMNS.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByStatus[column.id] || []}
              onTaskCreate={onTaskCreate}
              onTaskEdit={onTaskEdit}
            />
          ))}
        </div>
      </DragDropContext>
      
      {/* Overlay pendant le drag */}
      {isDragging && (
        <div className="fixed inset-0 bg-background/50 z-40 pointer-events-none" />
      )}
    </div>
  );
};