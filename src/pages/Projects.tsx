
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectPlannerAI } from '@/components/projects/ProjectPlannerAI';
import { KanbanBoard } from '@/components/projects/KanbanBoard';
import { GanttChart } from '@/components/projects/GanttChart';
import { 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp,
  Bot,
  Brain,
  Sparkles
} from 'lucide-react';

export default function Projects() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPlanner, setShowPlanner] = useState(false);
  const [selectedView, setSelectedView] = useState('cards');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [projectsData, companiesData, employeesData, tasksData] = await Promise.all([
        supabase.from('projects').select('*, client_company:companies(name)'),
        supabase.from('companies').select('*'),
        supabase.from('employees').select('*'),
        supabase.from('tasks').select('*')
      ]);

      if (projectsData.data) setProjects(projectsData.data);
      if (companiesData.data) setCompanies(companiesData.data);
      if (employeesData.data) setEmployees(employeesData.data);
      if (tasksData.data) setTasks(tasksData.data);
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

  const handleProjectCreated = (newProject) => {
    setProjects([...projects, newProject]);
    setShowPlanner(false);
    toast({
      title: "🎉 Projet créé !",
      description: "Le projet a été créé avec succès par Synapse"
    });
  };

  const handleTaskUpdate = async (task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: task.status,
          title: task.title,
          description: task.description,
          priority: task.priority,
          due_date: task.due_date,
          assignee_id: task.assignee_id
        })
        .eq('id', task.id);

      if (error) throw error;
      
      // Recharger les tâches
      const { data: updatedTasks } = await supabase.from('tasks').select('*');
      if (updatedTasks) setTasks(updatedTasks);
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la mise à jour de la tâche"
      });
    }
  };

  const handleTaskCreate = async () => {
    // Cette fonction sera appelée sans paramètres par le KanbanBoard
    // La logique de création sera gérée directement dans le KanbanBoard
    await loadData(); // Recharger les données après création
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'planning': return 'Planification';
      case 'in_progress': return 'En cours';
      case 'on_hold': return 'En pause';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
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
      {/* Header avec actions IA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion de Projets</h1>
          <p className="text-muted-foreground">
            Gérez vos projets avec l'assistance de Synapse IA
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowPlanner(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Brain className="h-4 w-4 mr-2" />
            🚀 Planification IA
          </Button>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Projet
          </Button>
        </div>
      </div>

      {/* Planificateur IA Modal */}
      {showPlanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  Synapse - Planification IA
                </h2>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowPlanner(false)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
              <ProjectPlannerAI
                onProjectCreated={handleProjectCreated}
                companies={companies}
                employees={employees}
              />
            </div>
          </div>
        </div>
      )}

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher des projets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Vues des projets */}
      <Tabs value={selectedView} onValueChange={setSelectedView}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cards">Cartes</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="gantt">Gantt</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-4">
          {filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun projet trouvé</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Commencez par créer votre premier projet avec l'aide de Synapse IA
                </p>
                <Button 
                  onClick={() => setShowPlanner(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Créer avec Synapse IA
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <Badge 
                        variant="secondary" 
                        className={`${getStatusColor(project.status)} text-white`}
                      >
                        {getStatusLabel(project.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {project.client_company?.name || 'Client non défini'}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{project.description}</p>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Non défini'}
                      </div>
                      {project.budget && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {project.budget.toLocaleString()} XOF
                        </div>
                      )}
                    </div>

                    {project.custom_fields?.aiGenerated && (
                      <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 p-2 rounded">
                        <Sparkles className="h-3 w-3" />
                        Généré par Synapse IA
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="kanban">
          <KanbanBoard 
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskCreate={handleTaskCreate}
            onTaskEdit={handleTaskUpdate}
          />
        </TabsContent>

        <TabsContent value="gantt">
          <GanttChart />
        </TabsContent>
      </Tabs>
    </div>
  );
}
