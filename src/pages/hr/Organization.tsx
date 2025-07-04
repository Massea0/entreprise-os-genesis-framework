import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, Crown, UserCheck, ChevronDown, ChevronRight, Briefcase, Mail, Phone } from 'lucide-react';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  manager_id?: string;
  positions: { title: string };
  departments: { id: string; name: string };
  branches: { name: string };
  subordinates?: Employee[];
}

interface Department {
  id: string;
  name: string;
  code: string;
  status: string;
  employee_count: number;
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface Branch {
  id: string;
  name: string;
}

export default function Organization() {
  const [organizationData, setOrganizationData] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadOrganizationData();
  }, [selectedBranch, selectedDepartment]);

  const loadOrganizationData = async () => {
    try {
      setIsLoading(true);
      
      // Load branches and departments
      const [branchesResponse, departmentsResponse] = await Promise.all([
        supabase.from('branches').select('id, name'),
        supabase.from('departments').select(`
          id, name, code, status,
          manager:manager_id(
            id, first_name, last_name
          )
        `)
      ]);

      if (branchesResponse.error) throw branchesResponse.error;
      if (departmentsResponse.error) throw departmentsResponse.error;

      setBranches(branchesResponse.data || []);

      // Get employee counts for departments
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

      // Load employees with hierarchy
      await loadEmployeeHierarchy();
      
    } catch (error) {
      console.error('Error loading organization data:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger l'organigramme"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployeeHierarchy = async () => {
    try {
      let employeeQuery = supabase
        .from('employees')
        .select(`
          id, first_name, last_name, manager_id,
          positions(title),
          departments(id, name),
          branches(name)
        `)
        .eq('employment_status', 'active');

      // Apply filters
      if (selectedBranch !== 'all') {
        employeeQuery = employeeQuery.eq('branch_id', selectedBranch);
      }
      if (selectedDepartment !== 'all') {
        employeeQuery = employeeQuery.eq('department_id', selectedDepartment);
      }

      const { data: employees, error } = await employeeQuery;
      
      if (error) throw error;

      // Build hierarchy
      const hierarchy = buildHierarchy(employees || []);
      setOrganizationData(hierarchy);
      
    } catch (error) {
      console.error('Error loading employee hierarchy:', error);
    }
  };

  const buildHierarchy = (employees: Employee[]): Employee[] => {
    const employeeMap = new Map<string, Employee>();
    const roots: Employee[] = [];

    // Create map and initialize subordinates
    employees.forEach(emp => {
      employeeMap.set(emp.id, { ...emp, subordinates: [] });
    });

    // Build hierarchy
    employees.forEach(emp => {
      const employee = employeeMap.get(emp.id)!;
      
      if (emp.manager_id && employeeMap.has(emp.manager_id)) {
        const manager = employeeMap.get(emp.manager_id)!;
        manager.subordinates!.push(employee);
      } else {
        roots.push(employee);
      }
    });

    return roots;
  };

  const toggleExpanded = (employeeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderEmployee = (employee: Employee, level: number = 0) => {
    const hasSubordinates = employee.subordinates && employee.subordinates.length > 0;
    const isExpanded = expandedNodes.has(employee.id);
    const indentLevel = level * 32;

    return (
      <div key={employee.id} className="mb-2">
        <Card className="relative">
          <CardContent className="p-4" style={{ marginLeft: `${indentLevel}px` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {hasSubordinates && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(employee.id)}
                    className="p-1 h-6 w-6"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
                
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {level === 0 ? (
                    <Crown className="h-5 w-5 text-primary" />
                  ) : (
                    <Users className="h-5 w-5 text-primary" />
                  )}
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">
                      {employee.first_name} {employee.last_name}
                    </h4>
                    <Badge variant="default">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                     <div className="flex items-center gap-4">
                       <div className="flex items-center gap-1">
                         <Briefcase className="h-3 w-3" />
                         <span>{employee.positions?.title}</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <Building2 className="h-3 w-3" />
                         <span>{employee.departments?.name}</span>
                       </div>
                     </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                  <div className="text-sm font-medium">
                    ID: {employee.id.slice(0, 8)}
                  </div>
                <div className="text-sm text-muted-foreground">
                  Équipe: {employee.departments?.name}
                </div>
                {hasSubordinates && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {employee.subordinates!.length} subordinate(s)
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Render subordinates */}
        {hasSubordinates && isExpanded && (
          <div className="mt-2">
            {employee.subordinates!.map(subordinate => 
              renderEmployee(subordinate, level + 1)
            )}
          </div>
        )}
      </div>
    );
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
      <div>
        <h1 className="text-3xl font-bold">Organigramme</h1>
        <p className="text-muted-foreground">
          Structure hiérarchique de l'organisation
        </p>
      </div>

      {/* Department Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Départements Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.filter(d => d.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              sur {departments.length} total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Employés Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.reduce((sum, dept) => sum + dept.employee_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              dans l'organisation
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.filter(d => d.manager).length}
            </div>
            <p className="text-xs text-muted-foreground">
              départements avec manager
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Filiale:</label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les filiales</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Département:</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les départements</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline"
              onClick={() => {
                if (expandedNodes.size > 0) {
                  setExpandedNodes(new Set());
                } else {
                  const allIds = new Set<string>();
                  const collectIds = (employees: Employee[]) => {
                    employees.forEach(emp => {
                      if (emp.subordinates && emp.subordinates.length > 0) {
                        allIds.add(emp.id);
                        collectIds(emp.subordinates);
                      }
                    });
                  };
                  collectIds(organizationData);
                  setExpandedNodes(allIds);
                }
              }}
            >
              {expandedNodes.size > 0 ? 'Réduire tout' : 'Développer tout'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Organization Chart */}
      <div className="space-y-4">
        {organizationData.length > 0 ? (
          organizationData.map(employee => renderEmployee(employee))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune donnée d'organigramme</h3>
              <p className="text-muted-foreground">
                {selectedBranch !== 'all' || selectedDepartment !== 'all' 
                  ? 'Aucun employé trouvé avec les filtres sélectionnés'
                  : 'Aucun employé actif trouvé dans l\'organisation'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}