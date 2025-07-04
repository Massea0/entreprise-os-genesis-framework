import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Calendar, 
  Users, 
  Target, 
  DollarSign,
  FolderOpen,
  BarChart3,
  CheckCircle2,
  PlayCircle,
  Building2,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ProjectForm } from '@/components/projects/ProjectForm';

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
  tasks?: Task[];
  owner?: { first_name: string; last_name: string };
  client_company?: { name: string };
  progress?: number;
  tasksCount?: number;
}

interface Task {
  id: string;
  status: string;
}

interface Company {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  user_id?: string;
}

const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planification', color: 'bg-blue-500' },
  { value: 'active', label: 'En cours', color: 'bg-green-500' },
  { value: 'on_hold', label: 'En pause', color: 'bg-yellow-500' },
  { value: 'completed', label: 'Terminé', color: 'bg-gray-500' },
  { value: 'cancelled', label: 'Annulé', color: 'bg-red-500' }
];

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
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

      // Calculate progress for each project
      const projectsWithProgress = (projectsResponse.data || []).map(project => {
        const tasks = project.tasks || [];
        const completedTasks = tasks.filter((t: Task) => t.status === 'done').length;
        const totalTasks = tasks.length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        return {
          ...project,
          progress,
          tasksCount: totalTasks
        };
      });

      setProjects(projectsWithProgress);
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

  const handleCreateProject = async (projectData: any) => {
    try {
      const { error } = await supabase
        .from('projects')
        .insert([projectData]);

      if (error) throw error;

      toast({
        title: "Projet créé",
        description: "Le nouveau projet a été créé avec succès"
      });

      setShowCreateDialog(false);
      loadData();
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la création du projet"
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
            Gérez et suivez vos projets
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Projet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nouveau projet</DialogTitle>
              <DialogDescription>
                Créez un nouveau projet pour votre équipe
              </DialogDescription>
            </DialogHeader>
            <ProjectForm
              companies={companies}
              employees={employees}
              onSave={handleCreateProject}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
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

      {/* Projects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const statusConfig = PROJECT_STATUSES.find(s => s.value === project.status);
          
          return (
            <Card key={project.id} className="hover:shadow-lg transition-shadow group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
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
                  <Link to={`/projects/${project.id}`}>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                
                {project.description && (
                  <CardDescription className="text-sm line-clamp-2">
                    {project.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progression</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {project.tasks?.filter(t => t.status === 'done').length || 0} / {project.tasksCount || 0} tâches terminées
                  </div>
                </div>

                {/* Project Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {project.start_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
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

                {/* Action Button */}
                <Link to={`/projects/${project.id}`} className="block">
                  <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Target className="h-4 w-4 mr-2" />
                    Voir le projet
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {projects.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun projet</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par créer votre premier projet
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un projet
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}