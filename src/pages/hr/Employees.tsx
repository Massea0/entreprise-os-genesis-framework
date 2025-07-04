import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Plus, Search, Edit, Trash2, UserCheck, UserX, Building2, Briefcase } from 'lucide-react';

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

interface Department {
  id: string;
  name: string;
}

interface Position {
  id: string;
  title: string;
}

interface Branch {
  id: string;
  name: string;
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    employee_number: '',
    work_email: '',
    personal_phone: '',
    hire_date: '',
    employment_status: 'active',
    employment_type: 'full_time',
    current_salary: 0,
    department_id: '',
    position_id: '',
    branch_id: '',
    skills: '',
    performance_score: 5
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [employeesResponse, departmentsResponse, positionsResponse, branchesResponse] = await Promise.all([
        supabase
          .from('employees')
          .select(`
            *,
            departments(name),
            positions(title),
            branches(name),
            manager:manager_id(first_name, last_name)
          `),
        supabase.from('departments').select('id, name'),
        supabase.from('positions').select('id, title'),
        supabase.from('branches').select('id, name')
      ]);

      if (employeesResponse.error) throw employeesResponse.error;
      if (departmentsResponse.error) throw departmentsResponse.error;
      if (positionsResponse.error) throw positionsResponse.error;
      if (branchesResponse.error) throw branchesResponse.error;

      setEmployees(employeesResponse.data || []);
      setDepartments(departmentsResponse.data || []);
      setPositions(positionsResponse.data || []);
      setBranches(branchesResponse.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les données"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const employeeData = {
        ...formData,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
        current_salary: Number(formData.current_salary),
        performance_score: Number(formData.performance_score),
        start_date: formData.hire_date
      };

      if (editingEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', editingEmployee.id);
        
        if (error) throw error;
        
        toast({
          title: "Employé mis à jour",
          description: "Les informations ont été mises à jour avec succès"
        });
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([employeeData]);
        
        if (error) throw error;
        
        toast({
          title: "Employé ajouté",
          description: "Le nouvel employé a été ajouté avec succès"
        });
      }

      setIsDialogOpen(false);
      setEditingEmployee(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder l'employé"
      });
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      first_name: employee.first_name,
      last_name: employee.last_name,
      employee_number: employee.employee_number,
      work_email: employee.work_email || '',
      personal_phone: employee.personal_phone || '',
      hire_date: employee.hire_date,
      employment_status: employee.employment_status,
      employment_type: employee.employment_type,
      current_salary: employee.current_salary || 0,
      department_id: employee.department_id,
      position_id: employee.position_id,
      branch_id: employee.branch_id,
      skills: Array.isArray(employee.skills) ? employee.skills.join(', ') : '',
      performance_score: employee.performance_score || 5
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (employeeId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) return;
    
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);
      
      if (error) throw error;
      
      toast({
        title: "Employé supprimé",
        description: "L'employé a été supprimé avec succès"
      });
      
      loadData();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer l'employé"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      employee_number: '',
      work_email: '',
      personal_phone: '',
      hire_date: '',
      employment_status: 'active',
      employment_type: 'full_time',
      current_salary: 0,
      department_id: '',
      position_id: '',
      branch_id: '',
      skills: '',
      performance_score: 5
    });
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = `${employee.first_name} ${employee.last_name} ${employee.employee_number}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || employee.employment_status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

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
      default: return <Users className="h-3 w-3" />;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Employés</h1>
          <p className="text-muted-foreground">
            Total: {employees.length} employés • Actifs: {employees.filter(e => e.employment_status === 'active').length}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingEmployee(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Employé
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? 'Modifier l\'employé' : 'Ajouter un employé'}
              </DialogTitle>
              <DialogDescription>
                {editingEmployee ? 'Modifiez les informations de l\'employé' : 'Ajoutez un nouvel employé à votre équipe'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Prénom *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Nom *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employee_number">Numéro Employé *</Label>
                  <Input
                    id="employee_number"
                    value={formData.employee_number}
                    onChange={(e) => setFormData({...formData, employee_number: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hire_date">Date d'embauche *</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="work_email">Email professionnel</Label>
                  <Input
                    id="work_email"
                    type="email"
                    value={formData.work_email}
                    onChange={(e) => setFormData({...formData, work_email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="personal_phone">Téléphone</Label>
                  <Input
                    id="personal_phone"
                    value={formData.personal_phone}
                    onChange={(e) => setFormData({...formData, personal_phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="branch_id">Filiale *</Label>
                  <Select value={formData.branch_id} onValueChange={(value) => setFormData({...formData, branch_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department_id">Département *</Label>
                  <Select value={formData.department_id} onValueChange={(value) => setFormData({...formData, department_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="position_id">Poste *</Label>
                  <Select value={formData.position_id} onValueChange={(value) => setFormData({...formData, position_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position.id} value={position.id}>
                          {position.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employment_status">Statut</Label>
                  <Select value={formData.employment_status} onValueChange={(value) => setFormData({...formData, employment_status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                      <SelectItem value="terminated">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="employment_type">Type d'emploi</Label>
                  <Select value={formData.employment_type} onValueChange={(value) => setFormData({...formData, employment_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Temps plein</SelectItem>
                      <SelectItem value="part_time">Temps partiel</SelectItem>
                      <SelectItem value="contract">Contractuel</SelectItem>
                      <SelectItem value="intern">Stagiaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current_salary">Salaire (XOF)</Label>
                  <Input
                    id="current_salary"
                    type="number"
                    value={formData.current_salary}
                    onChange={(e) => setFormData({...formData, current_salary: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="performance_score">Score Performance (1-10)</Label>
                  <Input
                    id="performance_score"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.performance_score}
                    onChange={(e) => setFormData({...formData, performance_score: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="skills">Compétences (séparées par des virgules)</Label>
                <Textarea
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => setFormData({...formData, skills: e.target.value})}
                  placeholder="JavaScript, React, Leadership, etc."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingEmployee ? 'Mettre à jour' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un employé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
                <SelectItem value="terminated">Terminés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employees Grid */}
      <div className="grid gap-4">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {employee.first_name} {employee.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {employee.employee_number} • {employee.work_email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {employee.departments?.name}
                      </span>
                      <Briefcase className="h-3 w-3 text-muted-foreground ml-2" />
                      <span className="text-xs text-muted-foreground">
                        {employee.positions?.title}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getStatusColor(employee.employment_status)}>
                        {getStatusIcon(employee.employment_status)}
                        {employee.employment_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Performance: {employee.performance_score || 'N/A'}/10
                    </p>
                    {employee.current_salary && (
                      <p className="text-sm font-medium">
                        {employee.current_salary.toLocaleString()} XOF
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(employee)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(employee.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {employee.skills && Array.isArray(employee.skills) && employee.skills.length > 0 && (
                <div className="mt-4">
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
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun employé trouvé</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedStatus !== 'all' 
                ? 'Aucun employé ne correspond à vos critères de recherche'
                : 'Commencez par ajouter votre premier employé'
              }
            </p>
            {!searchTerm && selectedStatus === 'all' && (
              <Button onClick={() => { resetForm(); setEditingEmployee(null); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un employé
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}