import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Building2, 
  Briefcase,
  UserCheck,
  UserX,
  Edit
} from 'lucide-react';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
  work_email: string;
  personal_phone: string;
  hire_date: string;
  start_date: string;
  employment_status: string;
  employment_type: string;
  current_salary: number;
  performance_score: number;
  skills: any;
  department_id: string;
  position_id: string;
  branch_id: string;
  departments: { name: string };
  positions: { title: string };
  branches: { name: string };
  manager?: { first_name: string; last_name: string };
}

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadEmployee();
    }
  }, [id]);

  const loadEmployee = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          departments(name),
          positions(title),
          branches(name),
          manager:manager_id(first_name, last_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setEmployee(data);
    } catch (error) {
      console.error('Error loading employee:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les données de l'employé"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'terminated': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <UserCheck className="h-3 w-3" />;
      case 'inactive': return <UserX className="h-3 w-3" />;
      case 'terminated': return <UserX className="h-3 w-3" />;
      default: return <User className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Employé introuvable</h2>
        <p className="text-muted-foreground mb-4">L'employé demandé n'existe pas ou vous n'avez pas les permissions pour le voir.</p>
        <Button onClick={() => navigate('/hr/employees')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/hr/employees')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {employee.first_name} {employee.last_name}
            </h1>
            <p className="text-muted-foreground">
              {employee.employee_number} • {employee.positions?.title}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={getStatusColor(employee.employment_status)}>
            {getStatusIcon(employee.employment_status)}
            {employee.employment_status}
          </Badge>
          <Button onClick={() => navigate(`/hr/employees/${employee.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Nom complet</label>
              <p>{employee.first_name} {employee.last_name}</p>
            </div>
            
            {employee.work_email && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-muted-foreground">Email professionnel</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p>{employee.work_email}</p>
                </div>
              </div>
            )}
            
            {employee.personal_phone && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p>{employee.personal_phone}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informations professionnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Informations professionnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Poste</label>
              <p>{employee.positions?.title}</p>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Département</label>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <p>{employee.departments?.name}</p>
              </div>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Filiale</label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p>{employee.branches?.name}</p>
              </div>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Type d'emploi</label>
              <p className="capitalize">{employee.employment_type.replace('_', ' ')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Dates importantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dates importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Date d'embauche</label>
              <p>{new Date(employee.hire_date).toLocaleDateString('fr-FR')}</p>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Date de début</label>
              <p>{new Date(employee.start_date).toLocaleDateString('fr-FR')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Performance et rémunération */}
        <Card>
          <CardHeader>
            <CardTitle>Performance et rémunération</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employee.performance_score && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-muted-foreground">Score de performance</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${(employee.performance_score / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{employee.performance_score}/10</span>
                </div>
              </div>
            )}
            
            {employee.current_salary && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-muted-foreground">Salaire actuel</label>
                <p className="text-lg font-semibold">{employee.current_salary.toLocaleString()} XOF</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compétences */}
      {employee.skills && Array.isArray(employee.skills) && employee.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Compétences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {employee.skills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manager */}
      {employee.manager && (
        <Card>
          <CardHeader>
            <CardTitle>Hiérarchie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Manager</label>
              <p>{employee.manager.first_name} {employee.manager.last_name}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}