import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { WorkOrganizer } from '@/components/ai/WorkOrganizer';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Target, 
  Briefcase, 
  Brain, 
  Calendar, 
  TrendingUp, 
  Clock,
  AlertTriangle,
  DollarSign
} from 'lucide-react';

interface DashboardStats {
  employees: number;
  activeProjects: number;
  pendingTasks: number;
  completedTasks: number;
  totalRevenue: number;
  averageWorkload: number;
}

interface EmployeeWorkload {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  current_tasks: number;
  estimated_hours: number;
  performance_score: number;
  skills: string[];
  status: 'overloaded' | 'optimal' | 'available';
}

interface ProjectOverview {
  id: string;
  name: string;
  status: string;
  budget: number;
  team_size: number;
  completion_percentage: number;
  deadline_risk: 'low' | 'medium' | 'high';
  client_name: string;
}

export default function WorkDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    employees: 0,
    activeProjects: 0,
    pendingTasks: 0,
    completedTasks: 0,
    totalRevenue: 0,
    averageWorkload: 0
  });
  
  const [employees, setEmployees] = useState<EmployeeWorkload[]>([]);
  const [projects, setProjects] = useState<ProjectOverview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load basic stats
      const [employeesData, projectsData, tasksData, invoicesData] = await Promise.all([
        supabase.from('employees').select('*').eq('employment_status', 'active'),
        supabase.from('projects').select('*').in('status', ['planning', 'active']),
        supabase.from('tasks').select('*'),
        supabase.from('invoices').select('amount').eq('status', 'paid')
      ]);

      // Calculate stats
      const activeEmployees = employeesData.data?.length || 0;
      const activeProjects = projectsData.data?.length || 0;
      const pendingTasks = tasksData.data?.filter(t => ['todo', 'in_progress'].includes(t.status)).length || 0;
      const completedTasks = tasksData.data?.filter(t => t.status === 'done').length || 0;
      const totalRevenue = invoicesData.data?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;

      setStats({
        employees: activeEmployees,
        activeProjects,
        pendingTasks,
        completedTasks,
        totalRevenue,
        averageWorkload: activeEmployees > 0 ? pendingTasks / activeEmployees : 0
      });

      // Load employee workloads with task counts
      if (employeesData.data) {
        const employeeWorkloads = await Promise.all(
          employeesData.data.map(async (emp) => {
            const { data: empTasks } = await supabase
              .from('tasks')
              .select('estimated_hours, status')
              .eq('assignee_id', emp.id)
              .in('status', ['todo', 'in_progress', 'review']);

            const totalHours = empTasks?.reduce((sum, task) => sum + (task.estimated_hours || 0), 0) || 0;
            const taskCount = empTasks?.length || 0;

            // Get department name
            const { data: deptData } = await supabase
              .from('departments')
              .select('name')
              .eq('id', emp.department_id)
              .single();

            return {
              id: emp.id,
              first_name: emp.first_name,
              last_name: emp.last_name,
              department: deptData?.name || 'Non assigné',
              current_tasks: taskCount,
              estimated_hours: totalHours,
              performance_score: emp.performance_score || 5,
              skills: emp.skills || [],
              status: totalHours > 40 ? 'overloaded' : totalHours < 10 ? 'available' : 'optimal'
            } as EmployeeWorkload;
          })
        );
        setEmployees(employeeWorkloads);
      }

      // Load project overviews
      if (projectsData.data) {
        const projectOverviews = await Promise.all(
          projectsData.data.map(async (proj) => {
            const { data: projTasks } = await supabase
              .from('tasks')
              .select('status, assignee_id')
              .eq('project_id', proj.id);

            const totalTasks = projTasks?.length || 0;
            const completedTasks = projTasks?.filter(t => t.status === 'done').length || 0;
            const teamMembers = new Set(projTasks?.map(t => t.assignee_id).filter(Boolean)).size;

            // Get client name
            const { data: clientData } = await supabase
              .from('companies')
              .select('name')
              .eq('id', proj.client_company_id)
              .single();

            // Calculate deadline risk
            const daysUntilDeadline = proj.end_date 
              ? Math.ceil((new Date(proj.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : 30;
            
            const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            let deadlineRisk: 'low' | 'medium' | 'high' = 'low';
            
            if (daysUntilDeadline < 7 && completionRate < 80) deadlineRisk = 'high';
            else if (daysUntilDeadline < 14 && completionRate < 60) deadlineRisk = 'medium';

            return {
              id: proj.id,
              name: proj.name,
              status: proj.status,
              budget: proj.budget || 0,
              team_size: teamMembers,
              completion_percentage: completionRate,
              deadline_risk: deadlineRisk,
              client_name: clientData?.name || 'Client inconnu'
            } as ProjectOverview;
          })
        );
        setProjects(projectOverviews);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les données du tableau de bord"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overloaded': return 'destructive';
      case 'available': return 'secondary';
      case 'optimal': return 'default';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de Bord IA</h1>
          <p className="text-muted-foreground">
            Gestion intelligente des ressources et organisation du travail
          </p>
        </div>
        <Button onClick={loadDashboardData}>
          <TrendingUp className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Employés Actifs</p>
                <p className="text-2xl font-bold">{stats.employees}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Projets Actifs</p>
                <p className="text-2xl font-bold">{stats.activeProjects}</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tâches en Cours</p>
                <p className="text-2xl font-bold">{stats.pendingTasks}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tâches Terminées</p>
                <p className="text-2xl font-bold">{stats.completedTasks}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenus</p>
                <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()}€</p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Charge Moyenne</p>
                <p className="text-2xl font-bold">{Math.round(stats.averageWorkload)}</p>
              </div>
              <Brain className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="organizer" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="organizer">
            <Brain className="h-4 w-4 mr-2" />
            Organisateur IA
          </TabsTrigger>
          <TabsTrigger value="employees">
            <Users className="h-4 w-4 mr-2" />
            Employés
          </TabsTrigger>
          <TabsTrigger value="projects">
            <Target className="h-4 w-4 mr-2" />
            Projets
          </TabsTrigger>
          <TabsTrigger value="business">
            <Briefcase className="h-4 w-4 mr-2" />
            Business
          </TabsTrigger>
        </TabsList>

        {/* AI Work Organizer Tab */}
        <TabsContent value="organizer" className="mt-6">
          <WorkOrganizer />
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Charge de Travail des Employés
              </CardTitle>
              <CardDescription>
                Vue d'ensemble de la répartition du travail et des compétences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {employees.map((employee) => (
                  <div key={employee.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">
                          {employee.first_name} {employee.last_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">{employee.department}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(employee.status)}>
                          {employee.status === 'overloaded' ? 'Surchargé' : 
                           employee.status === 'available' ? 'Disponible' : 'Optimal'}
                        </Badge>
                        <span className="text-sm font-medium">
                          {employee.performance_score}/10
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{employee.current_tasks}</p>
                        <p className="text-xs text-muted-foreground">Tâches actives</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">{employee.estimated_hours}h</p>
                        <p className="text-xs text-muted-foreground">Heures estimées</p>
                      </div>
                      <div className="text-center">
                        <div className="flex justify-center">
                          <Progress 
                            value={Math.min(100, (employee.estimated_hours / 40) * 100)} 
                            className="w-16 h-2"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Capacité</p>
                      </div>
                    </div>
                    
                    {employee.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {employee.skills.slice(0, 5).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {employee.skills.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{employee.skills.length - 5}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Vue d'Ensemble des Projets
              </CardTitle>
              <CardDescription>
                Suivi des projets actifs et allocation des équipes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {projects.map((project) => (
                  <div key={project.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Client: {project.client_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(project.deadline_risk)}>
                          Risque {project.deadline_risk}
                        </Badge>
                        <Badge variant="outline">{project.status}</Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">
                          {project.budget.toLocaleString()}€
                        </p>
                        <p className="text-xs text-muted-foreground">Budget</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600">{project.team_size}</p>
                        <p className="text-xs text-muted-foreground">Équipe</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-purple-600">
                          {Math.round(project.completion_percentage)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Complété</p>
                      </div>
                      <div className="text-center">
                        <Progress 
                          value={project.completion_percentage} 
                          className="w-16 h-2 mx-auto"
                        />
                        <p className="text-xs text-muted-foreground">Avancement</p>
                      </div>
                    </div>
                    
                    {project.deadline_risk === 'high' && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        Attention: Risque de dépassement de délai
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Performance Commerciale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Revenus totaux</span>
                    <span className="font-bold text-green-600">
                      {stats.totalRevenue.toLocaleString()}€
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Projets actifs</span>
                    <span className="font-bold">{stats.activeProjects}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Revenus/Projet</span>
                    <span className="font-bold">
                      {stats.activeProjects > 0 
                        ? Math.round(stats.totalRevenue / stats.activeProjects).toLocaleString()
                        : '0'
                      }€
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Productivité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Tâches terminées</span>
                    <span className="font-bold text-green-600">{stats.completedTasks}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Taux de completion</span>
                    <span className="font-bold">
                      {stats.pendingTasks + stats.completedTasks > 0
                        ? Math.round((stats.completedTasks / (stats.pendingTasks + stats.completedTasks)) * 100)
                        : 0
                      }%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tâches/Employé</span>
                    <span className="font-bold">
                      {stats.employees > 0 
                        ? Math.round((stats.pendingTasks + stats.completedTasks) / stats.employees)
                        : 0
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}