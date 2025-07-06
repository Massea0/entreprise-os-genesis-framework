
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectPlannerAI } from '@/components/projects/ProjectPlannerAI';
import { 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp,
  Bot,
  Brain,
  Sparkles,
  ArrowRight,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [projectsData, companiesData, employeesData, tasksData] = await Promise.all([
        supabase
          .from('projects')
          .select(`
            *,
            client_company:companies(name)
          `),
        supabase.from('companies').select('*'),
        supabase.from('employees').select('*'),
        supabase.from('tasks').select('*')
      ]);

      if (projectsData.data) {
        // Calculer la progression pour chaque projet et charger les owners
        const projectsWithProgress = await Promise.all(
          projectsData.data.map(async (project) => {
            const projectTasks = tasksData.data?.filter(task => task.project_id === project.id) || [];
            const completedTasks = projectTasks.filter(task => task.status === 'done').length;
            const totalTasks = projectTasks.length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            // Charger le owner si existe
            let ownerData = null;
            if (project.owner_id) {
              const { data: employeeData } = await supabase
                .from('employees')
                .select('first_name, last_name')
                .eq('user_id', project.owner_id)
                .single();
              
              if (employeeData) {
                ownerData = employeeData;
              }
            }
            
            return {
              ...project,
              owner: ownerData,
              tasks: projectTasks,
              progress,
              tasksCount: totalTasks,
              completedTasks
            };
          })
        );
        setProjects(projectsWithProgress);
      }
      
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

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-blue-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'planning': return 'Planification';
      case 'active': return 'En cours';
      case 'on_hold': return 'En pause';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
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

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-primary" />
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
              <Users className="h-8 w-8 text-green-600" />
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
              <Calendar className="h-8 w-8 text-blue-600" />
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
                  {(stats.totalBudget / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-muted-foreground">Budget total (XOF)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche */}
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

      {/* Liste des projets */}
      <div className="space-y-4">
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
          filteredProjects.map((project) => (
            <Card key={project.id} className="p-6 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold truncate">{project.name}</h3>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      <div className={`w-2 h-2 rounded-full mr-1 ${getStatusColor(project.status)}`} />
                      {getStatusLabel(project.status)}
                    </Badge>
                    {project.client_company && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        <Building2 className="h-3 w-3 mr-1" />
                        {project.client_company.name}
                      </Badge>
                    )}
                    {project.custom_fields?.aiGenerated && (
                      <Badge variant="outline" className="text-xs text-purple-600 bg-purple-50 shrink-0">
                        <Sparkles className="h-3 w-3 mr-1" />
                        IA
                      </Badge>
                    )}
                  </div>
                  
                  {project.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progression</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{project.completedTasks} / {project.tasksCount} tâches terminées</span>
                      <div className="flex items-center gap-4">
                        {project.start_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(project.start_date), 'dd/MM/yy', { locale: fr })}</span>
                          </div>
                        )}
                        {project.budget && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span>{(project.budget / 1000000).toFixed(1)}M XOF</span>
                          </div>
                        )}
                        {project.owner && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{project.owner.first_name} {project.owner.last_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <Link to={`/projects/${project.id}`}>
                  <Button variant="ghost" size="sm" className="ml-4">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
