import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, User, ChevronDown, ChevronRight } from 'lucide-react';

interface EmployeeNode {
  id: string;
  first_name: string;
  last_name: string;
  position_id: string;
  manager_id?: string;
  positions?: { title: string };
  children?: EmployeeNode[];
}

// Utilitaire pour transformer la liste plate en arbre
function buildOrgTree(employees: EmployeeNode[]): EmployeeNode[] {
  const map = new Map<string, EmployeeNode>();
  employees.forEach(emp => map.set(emp.id, { ...emp, children: [] }));
  const roots: EmployeeNode[] = [];
  map.forEach(emp => {
    if (emp.manager_id && map.has(emp.manager_id)) {
      map.get(emp.manager_id)!.children!.push(emp);
    } else {
      roots.push(emp);
    }
  });
  return roots;
}

const EmployeeTree: React.FC<{ node: EmployeeNode }> = ({ node }) => {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="ml-4 mt-2">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        {node.children && node.children.length > 0 ? (
          expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
        ) : <span className="w-4 h-4" />}
        <User className="w-5 h-5 text-blue-600" />
        <span className="font-medium text-enterprise-neutral-900 dark:text-white">
          {node.first_name} {node.last_name}
        </span>
        <span className="text-xs text-enterprise-neutral-500 ml-2">{node.positions?.title || '—'}</span>
      </div>
      {expanded && node.children && node.children.length > 0 && (
        <div className="ml-6 border-l border-enterprise-neutral-200 dark:border-enterprise-neutral-700 pl-2">
          {node.children.map(child => <EmployeeTree key={child.id} node={child} />)}
        </div>
      )}
    </div>
  );
};

export const EmployeeOrgChart: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, position_id, manager_id, positions(title)');
      
      if (!error && data) {
        const treeData = buildOrgTree(data);
        setEmployees(treeData);
      } else {
        console.error('Error fetching employees:', error);
      }
      setLoading(false);
    };
    fetchEmployees();
  }, []);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>
          <Users className="inline w-6 h-6 mr-2 text-blue-600" /> Organigramme Entreprise
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">Chargement...</div>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">Aucun employé trouvé. Vérifiez les données dans la console.</div>
          </div>
        ) : (
          <div className="space-y-2">
            {employees.map(root => <EmployeeTree key={root.id} node={root} />)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeOrgChart;
