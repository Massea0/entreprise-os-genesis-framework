import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { WorkOrganizer } from '@/components/ai/WorkOrganizer';
import { 
  Brain, 
  Users, 
  Target, 
  TrendingUp, 
  Clock, 
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar as CalendarIcon,
  FolderOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function WorkDashboard() {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [projectsResponse, employeesResponse] = await Promise.all([
        supabase.from('projects').select('*').in('status', ['planning', 'active']),
        supabase.from('employees').select('*').eq('employment_status', 'active')
      ]);

      setProjects(projectsResponse.data || []);
      setEmployees(employeesResponse.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les données"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Tableau de Bord - Travail</h1>
          <p className="text-muted-foreground">
            Organisation intelligente des projets et assignation des tâches
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="employees">
            <Users className="h-4 w-4 mr-2" />
            Employés
          </TabsTrigger>
          <TabsTrigger value="ai_organizer">
            <Brain className="h-4 w-4 mr-2" />
            IA Organisateur
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{employees.length}</p>
                    <p className="text-sm text-muted-foreground">Employés</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <FolderOpen className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{projects.length}</p>
                    <p className="text-sm text-muted-foreground">Projets Actifs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Target className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Tâches en Attente</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee: any) => (
              <Card key={employee.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {employee.first_name} {employee.last_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline">Employé Actif</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai_organizer" className="space-y-6">
          <WorkOrganizer />
        </TabsContent>
      </Tabs>
    </div>
  );
}