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
import { Building2, Plus, Users, Edit, Trash2, MapPin, DollarSign } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  status: string;
  annual_budget: number;
  max_employees: number;
  level: number;
  branch_id: string;
  manager_id?: string;
  parent_department_id?: string;
  branches: { name: string };
  manager?: { first_name: string; last_name: string };
  parent_department?: { name: string };
  employee_count?: number;
}

interface Branch {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'active',
    annual_budget: 0,
    max_employees: 50,
    level: 1,
    branch_id: '',
    manager_id: '',
    parent_department_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [departmentsResponse, branchesResponse, employeesResponse] = await Promise.all([
        supabase
          .from('departments')
          .select(`
            *,
            branches(name),
            manager:manager_id(first_name, last_name),
            parent_department:parent_department_id(name)
          `),
        supabase.from('branches').select('id, name'),
        supabase.from('employees').select('id, first_name, last_name')
      ]);

      if (departmentsResponse.error) throw departmentsResponse.error;
      if (branchesResponse.error) throw branchesResponse.error;
      if (employeesResponse.error) throw employeesResponse.error;

      // Get employee counts for each department
      const departmentsWithCounts = await Promise.all(
        (departmentsResponse.data || []).map(async (dept) => {
          const { count } = await supabase
            .from('employees')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', dept.id)
            .eq('employment_status', 'active');
          
          return { ...dept, employee_count: count || 0 };
        })
      );

      setDepartments(departmentsWithCounts);
      setBranches(branchesResponse.data || []);
      setEmployees(employeesResponse.data || []);
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
      const departmentData = {
        ...formData,
        annual_budget: Number(formData.annual_budget),
        max_employees: Number(formData.max_employees),
        level: Number(formData.level),
        manager_id: formData.manager_id || null,
        parent_department_id: formData.parent_department_id || null
      };

      if (editingDepartment) {
        const { error } = await supabase
          .from('departments')
          .update(departmentData)
          .eq('id', editingDepartment.id);
        
        if (error) throw error;
        
        toast({
          title: "Département mis à jour",
          description: "Les informations ont été mises à jour avec succès"
        });
      } else {
        const { error } = await supabase
          .from('departments')
          .insert([departmentData]);
        
        if (error) throw error;
        
        toast({
          title: "Département ajouté",
          description: "Le nouveau département a été ajouté avec succès"
        });
      }

      setIsDialogOpen(false);
      setEditingDepartment(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving department:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder le département"
      });
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || '',
      status: department.status,
      annual_budget: department.annual_budget || 0,
      max_employees: department.max_employees || 50,
      level: department.level || 1,
      branch_id: department.branch_id,
      manager_id: department.manager_id || '',
      parent_department_id: department.parent_department_id || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (departmentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce département ?')) return;
    
    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', departmentId);
      
      if (error) throw error;
      
      toast({
        title: "Département supprimé",
        description: "Le département a été supprimé avec succès"
      });
      
      loadData();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le département"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      status: 'active',
      annual_budget: 0,
      max_employees: 50,
      level: 1,
      branch_id: '',
      manager_id: '',
      parent_department_id: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      default: return 'outline';
    }
  };

  const getCapacityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
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
          <h1 className="text-3xl font-bold">Gestion des Départements</h1>
          <p className="text-muted-foreground">
            Total: {departments.length} départements • Actifs: {departments.filter(d => d.status === 'active').length}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingDepartment(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Département
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingDepartment ? 'Modifier le département' : 'Ajouter un département'}
              </DialogTitle>
              <DialogDescription>
                {editingDepartment ? 'Modifiez les informations du département' : 'Créez un nouveau département'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom du département *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Description du département..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="status">Statut</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manager_id">Manager</Label>
                  <Select value={formData.manager_id} onValueChange={(value) => setFormData({...formData, manager_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucun</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.first_name} {employee.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="parent_department_id">Département parent</Label>
                  <Select value={formData.parent_department_id} onValueChange={(value) => setFormData({...formData, parent_department_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Aucun</SelectItem>
                      {departments
                        .filter(dept => dept.id !== editingDepartment?.id)
                        .map((department) => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="annual_budget">Budget annuel (XOF)</Label>
                  <Input
                    id="annual_budget"
                    type="number"
                    value={formData.annual_budget}
                    onChange={(e) => setFormData({...formData, annual_budget: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="max_employees">Nombre max d'employés</Label>
                  <Input
                    id="max_employees"
                    type="number"
                    value={formData.max_employees}
                    onChange={(e) => setFormData({...formData, max_employees: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="level">Niveau hiérarchique</Label>
                  <Input
                    id="level"
                    type="number"
                    min="1"
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingDepartment ? 'Mettre à jour' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Departments Grid */}
      <div className="grid gap-4">
        {departments.map((department) => (
          <Card key={department.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{department.name}</h3>
                      <Badge variant={getStatusColor(department.status)}>
                        {department.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Code: {department.code}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {department.branches?.name}
                      </div>
                      {department.manager && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Manager: {department.manager.first_name} {department.manager.last_name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4" />
                      <span className={`font-medium ${getCapacityColor(department.employee_count || 0, department.max_employees || 50)}`}>
                        {department.employee_count || 0}/{department.max_employees || 50}
                      </span>
                      <span className="text-sm text-muted-foreground">employés</span>
                    </div>
                    {department.annual_budget && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {department.annual_budget.toLocaleString()} XOF
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(department)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(department.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {department.description && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{department.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {departments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun département trouvé</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par créer votre premier département
            </p>
            <Button onClick={() => { resetForm(); setEditingDepartment(null); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un département
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}