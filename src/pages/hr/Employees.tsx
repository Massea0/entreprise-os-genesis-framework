
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Users } from 'lucide-react';
import { EmployeeForm } from '@/components/hr/EmployeeForm';
import { EmployeeCard } from '@/components/hr/EmployeeCard';
import { EmployeeFilters } from '@/components/hr/EmployeeFilters';
import { EmployeeStats } from '@/components/hr/EmployeeStats';

export default function Employees() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // États principaux
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // États de filtrage
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [employeesRes, departmentsRes, positionsRes, branchesRes] = await Promise.all([
        supabase
          .from('employees')
          .select(`
            *,
            departments(name),
            positions(title),
            branches(name)
          `),
        supabase.from('departments').select('id, name').eq('status', 'active'),
        supabase.from('positions').select('id, title').eq('status', 'active'),
        supabase.from('branches').select('id, name').eq('status', 'active')
      ]);

      if (employeesRes.error) throw employeesRes.error;
      if (departmentsRes.error) throw departmentsRes.error;
      if (positionsRes.error) throw positionsRes.error;
      if (branchesRes.error) throw branchesRes.error;

      setEmployees(employeesRes.data || []);
      setDepartments(departmentsRes.data || []);
      setPositions(positionsRes.data || []);
      setBranches(branchesRes.data || []);
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

  const handleSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);
      
      const employeeData = {
        ...formData,
        skills: formData.skills ? formData.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        start_date: formData.hire_date,
      };

      let result;
      if (editingEmployee) {
        result = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', editingEmployee.id);
      } else {
        result = await supabase
          .from('employees')
          .insert([employeeData]);
      }

      if (result.error) throw result.error;

      toast({
        title: editingEmployee ? "Employé mis à jour" : "Employé créé",
        description: editingEmployee 
          ? "Les informations ont été mises à jour avec succès"
          : "Le nouvel employé a été ajouté avec succès"
      });

      setIsDialogOpen(false);
      setEditingEmployee(null);
      loadData();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder l'employé"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (employee: any) => {
    setEditingEmployee(employee);
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

  const handleViewDetails = (employeeId: string) => {
    navigate(`/hr/employees/${employeeId}`);
  };

  const handleNewEmployee = () => {
    setEditingEmployee(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingEmployee(null);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedDepartment('all');
    setSelectedBranch('all');
  };

  // Filtrage des employés
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = searchTerm === '' || 
      `${employee.first_name} ${employee.last_name} ${employee.employee_number}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || employee.employment_status === selectedStatus;
    const matchesDepartment = selectedDepartment === 'all' || employee.department_id === selectedDepartment;
    const matchesBranch = selectedBranch === 'all' || employee.branch_id === selectedBranch;

    return matchesSearch && matchesStatus && matchesDepartment && matchesBranch;
  });

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
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gestion des Employés</h1>
            <p className="text-muted-foreground">
              Gérez votre équipe et suivez les performances
            </p>
          </div>
        </div>
        
        <Button onClick={handleNewEmployee}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel Employé
        </Button>
      </div>

      {/* Statistiques */}
      <EmployeeStats 
        employees={filteredEmployees}
        departments={departments}
        positions={positions}
      />

      {/* Filtres */}
      <EmployeeFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
        departments={departments}
        branches={branches}
        onReset={resetFilters}
        totalCount={employees.length}
        filteredCount={filteredEmployees.length}
      />

      {/* Liste des employés */}
      {filteredEmployees.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {employees.length === 0 
              ? "Aucun employé trouvé" 
              : "Aucun employé ne correspond aux filtres"
            }
          </h3>
          <p className="text-muted-foreground mb-4">
            {employees.length === 0 
              ? "Commencez par ajouter votre premier employé"
              : "Essayez de modifier vos critères de recherche"
            }
          </p>
          {employees.length === 0 && (
            <Button onClick={handleNewEmployee}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un employé
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Dialog pour ajout/modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'Modifier l\'employé' : 'Nouvel employé'}
            </DialogTitle>
          </DialogHeader>
          
          <EmployeeForm
            employee={editingEmployee}
            departments={departments}
            positions={positions}
            branches={branches}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
