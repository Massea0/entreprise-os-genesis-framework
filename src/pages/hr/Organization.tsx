import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, Crown, UserCheck, ChevronDown, ChevronRight, Briefcase, User, MapPin, Network, TreePine } from 'lucide-react';
import { ConventionalOrgChart } from '@/components/hr/ConventionalOrgChart';

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
  code: string;
  city: string;
  country: string;
  status: string;
  director?: { first_name: string; last_name: string };
  hr_manager?: { first_name: string; last_name: string };
}

// Composant pour afficher un nœud de l'organigramme en format arbre
const OrgTreeNode = ({ 
  employee, 
  level = 0, 
  isExpanded = false, 
  onToggle, 
  totalSubordinates = 0 
}: { 
  employee: Employee;
  level?: number;
  isExpanded?: boolean;
  onToggle?: () => void;
  totalSubordinates?: number;
}) => {
  const hasSubordinates = employee.subordinates && employee.subordinates.length > 0;
  const indentWidth = level * 24;

  return (
    <div className="relative">
      {/* Ligne de connexion verticale */}
      {level > 0 && (
        <div 
          className="absolute left-0 top-0 w-px h-full bg-border -translate-x-3"
          style={{ left: `${indentWidth - 12}px` }}
        />
      )}
      
      {/* Ligne de connexion horizontale */}
      {level > 0 && (
        <div 
          className="absolute top-6 w-3 h-px bg-border"
          style={{ left: `${indentWidth - 12}px` }}
        />
      )}

      <div 
        className="flex items-center gap-3 py-2 px-4 hover:bg-muted/50 rounded-lg transition-colors"
        style={{ paddingLeft: `${indentWidth + 16}px` }}
      >
        {/* Bouton d'expansion/réduction */}
        {hasSubordinates && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-6 w-6 p-0 shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        
        {!hasSubordinates && <div className="w-6" />}

        {/* Avatar/Icône */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          level === 0 ? 'bg-primary text-primary-foreground' : 
          hasSubordinates ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          {level === 0 ? (
            <Crown className="h-4 w-4" />
          ) : hasSubordinates ? (
            <Users className="h-4 w-4" />
          ) : (
            <User className="h-4 w-4" />
          )}
        </div>

        {/* Informations employé */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium truncate">
              {employee.first_name} {employee.last_name}
            </span>
            <Badge variant="secondary" className="text-xs">
              {employee.positions?.title}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{employee.departments?.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{employee.branches?.name}</span>
            </div>
          </div>
        </div>

        {/* Compteur subordinates */}
        {hasSubordinates && (
          <Badge variant="outline" className="text-xs shrink-0">
            {employee.subordinates!.length} direct{employee.subordinates!.length > 1 ? 's' : ''}
            {totalSubordinates > employee.subordinates!.length && 
              ` • ${totalSubordinates} total`
            }
          </Badge>
        )}
      </div>
    </div>
  );
};

export default function Organization() {
  const [organizationData, setOrganizationData] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'hierarchy' | 'tree'>('hierarchy');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadOrganizationData();
  }, [selectedBranch, selectedDepartment]);

  const loadOrganizationData = async () => {
    try {
      setIsLoading(true);
      
      // Load branches and departments with enhanced data
      const [branchesResponse, departmentsResponse] = await Promise.all([
        supabase
          .from('branches')
          .select('id, name, code, city, country, status'),
        supabase
          .from('departments')
          .select(`
            id, name, code, status,
            manager:manager_id(id, first_name, last_name)
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
          positions!inner(title),
          departments!inner(id, name),
          branches!inner(name)
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

  const countTotalSubordinates = (employee: Employee): number => {
    if (!employee.subordinates || employee.subordinates.length === 0) return 0;
    
    return employee.subordinates.reduce((count, sub) => {
      return count + 1 + countTotalSubordinates(sub);
    }, 0);
  };

  const renderEmployeeTree = (employee: Employee, level: number = 0) => {
    const hasSubordinates = employee.subordinates && employee.subordinates.length > 0;
    const isExpanded = expandedNodes.has(employee.id);
    const totalSubordinates = countTotalSubordinates(employee);

    return (
      <div key={employee.id}>
        <OrgTreeNode
          employee={employee}
          level={level}
          isExpanded={isExpanded}
          onToggle={() => toggleExpanded(employee.id)}
          totalSubordinates={totalSubordinates}
        />
        
        {hasSubordinates && isExpanded && (
          <div className="ml-2">
            {employee.subordinates!.map(subordinate => 
              renderEmployeeTree(subordinate, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  // Fonction pour afficher les employés en mode grille
  const renderEmployeeGrid = (employee: Employee) => {
    const hasSubordinates = employee.subordinates && employee.subordinates.length > 0;
    const totalSubordinates = countTotalSubordinates(employee);

    return (
      <Card key={employee.id} className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar/Icône */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            hasSubordinates ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            {hasSubordinates ? (
              <Users className="h-5 w-5" />
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>

          {/* Informations employé */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold truncate">
                {employee.first_name} {employee.last_name}
              </h3>
              {hasSubordinates && (
                <Crown className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            
            <Badge variant="secondary" className="mb-2">
              {employee.positions?.title}
            </Badge>
            
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                <span className="truncate">{employee.departments?.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{employee.branches?.name}</span>
              </div>
              {hasSubordinates && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>
                    {employee.subordinates!.length} direct{employee.subordinates!.length > 1 ? 's' : ''}
                    {totalSubordinates > employee.subordinates!.length && 
                      ` • ${totalSubordinates} total`
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Fonction pour collecter tous les employés en mode flat pour la grille
  const getAllEmployeesFlat = (employees: Employee[]): Employee[] => {
    let result: Employee[] = [];
    employees.forEach(emp => {
      result.push(emp);
      if (emp.subordinates && emp.subordinates.length > 0) {
        result = result.concat(getAllEmployeesFlat(emp.subordinates));
      }
    });
    return result;
  };

  const expandAll = () => {
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
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Organigramme</h1>
          <p className="text-muted-foreground">
            Structure hiérarchique interactive de l'organisation
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'hierarchy' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('hierarchy')}
          >
            <Network className="h-4 w-4 mr-1" />
            Hiérarchique
          </Button>
          <Button
            variant={viewMode === 'tree' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('tree')}
          >
            <TreePine className="h-4 w-4 mr-1" />
            Arbre
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Filiales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {branches.filter(b => b.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              actives sur {branches.length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Départements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.filter(d => d.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              avec {departments.filter(d => d.manager).length} managers
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Employés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.reduce((sum, dept) => sum + dept.employee_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              employés actifs
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Direction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizationData.length}
            </div>
            <p className="text-xs text-muted-foreground">
              niveau(x) racine
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
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
                      {branch.name} ({branch.city})
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
                      {dept.name} ({dept.employee_count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Développer tout
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Réduire tout
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Structure Organisationnelle
          </CardTitle>
          <CardDescription>
            Vue hiérarchique avec liens matérialisés ou format arbre textuel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewMode === 'hierarchy' ? (
            <ConventionalOrgChart />
          ) : organizationData.length > 0 ? (
            <div className="space-y-1 font-mono text-sm">
              {organizationData.map(employee => renderEmployeeTree(employee))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune donnée d'organigramme</h3>
              <p className="text-muted-foreground">
                {selectedBranch !== 'all' || selectedDepartment !== 'all' 
                  ? 'Aucun employé trouvé avec les filtres sélectionnés'
                  : 'Aucun employé actif trouvé dans l\'organisation'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
