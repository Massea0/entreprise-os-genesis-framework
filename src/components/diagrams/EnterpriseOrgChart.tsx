import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Users, RotateCcw, Maximize2, Plus, Minus, Download } from 'lucide-react';
import EmployeeNode, { EmployeeNodeData } from './nodes/EmployeeNode';
import HierarchyEdge from './edges/HierarchyEdge';
import { DiagramProvider } from './DiagramProvider';

// Types des données d'employé depuis Supabase
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

// Configuration des types de nœuds et d'arêtes
const nodeTypes = {
  employee: EmployeeNode,
};

const edgeTypes = {
  hierarchy: HierarchyEdge,
};

// Algorithme de layout hiérarchique
const calculateHierarchicalLayout = (employees: Employee[]): { nodes: Node[], edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeMap = new Map<string, Employee>();
  const levelMap = new Map<string, number>();
  const positionMap = new Map<string, { x: number; y: number }>();

  // Construire la map des employés
  const buildEmployeeMap = (empList: Employee[], level = 0) => {
    empList.forEach(emp => {
      nodeMap.set(emp.id, emp);
      levelMap.set(emp.id, level);
      if (emp.subordinates) {
        buildEmployeeMap(emp.subordinates, level + 1);
      }
    });
  };

  buildEmployeeMap(employees);

  // Calculer les positions
  const NODE_WIDTH = 220;
  const NODE_HEIGHT = 160;
  const LEVEL_HEIGHT = 200;
  const MIN_SPACING = 50;

  // Grouper par niveau
  const levelGroups = new Map<number, Employee[]>();
  nodeMap.forEach((emp, id) => {
    const level = levelMap.get(id)!;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(emp);
  });

  // Positionner chaque niveau
  levelGroups.forEach((emps, level) => {
    const totalWidth = emps.length * NODE_WIDTH + (emps.length - 1) * MIN_SPACING;
    const startX = -totalWidth / 2;
    
    emps.forEach((emp, index) => {
      const x = startX + index * (NODE_WIDTH + MIN_SPACING);
      const y = level * LEVEL_HEIGHT;
      positionMap.set(emp.id, { x, y });
    });
  });

  // Créer les nœuds
  nodeMap.forEach((emp) => {
    const position = positionMap.get(emp.id)!;
    const level = levelMap.get(emp.id)!;
    const subordinateCount = emp.subordinates?.length || 0;
    
    const nodeData: EmployeeNodeData = {
      id: emp.id,
      firstName: emp.first_name,
      lastName: emp.last_name,
      title: emp.positions.title,
      department: emp.departments.name,
      branch: emp.branches?.name,
      level,
      isManager: subordinateCount > 0,
      isDirector: level === 0,
      subordinateCount,
      isExpanded: true,
      onToggleExpand: undefined, // Sera défini dans le composant parent
    };

    nodes.push({
      id: emp.id,
      type: 'employee',
      position,
      data: nodeData as any,
      draggable: true,
    });
  });

  // Créer les arêtes
  nodeMap.forEach((emp) => {
    if (emp.manager_id && nodeMap.has(emp.manager_id)) {
      edges.push({
        id: `${emp.manager_id}-${emp.id}`,
        source: emp.manager_id,
        target: emp.id,
        type: 'hierarchy',
        animated: false,
        data: { relationship: 'reports_to' },
      });
    }
  });

  return { nodes, edges };
};

export const ReactFlowOrgChart: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Fonction pour construire la hiérarchie
  const buildHierarchy = useCallback((employeeList: any[]): Employee[] => {
    const employeeMap = new Map<string, Employee>();
    const roots: Employee[] = [];

    // Créer la map des employés
    employeeList.forEach(emp => {
      employeeMap.set(emp.id, { ...emp, subordinates: [] });
    });

    // Construire la hiérarchie
    employeeMap.forEach(emp => {
      if (emp.manager_id && employeeMap.has(emp.manager_id)) {
        const manager = employeeMap.get(emp.manager_id)!;
        manager.subordinates!.push(emp);
      } else {
        roots.push(emp);
      }
    });

    return roots;
  }, []);

  // Charger les données des employés
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('employees')
          .select(`
            id, first_name, last_name, manager_id,
            positions!inner(title),
            departments!inner(id, name),
            branches!inner(name)
          `)
          .eq('employment_status', 'active');
        
        if (!error && data) {
          const hierarchy = buildHierarchy(data);
          setEmployees(hierarchy);
          
          // Étendre automatiquement le premier niveau
          const firstLevelIds = new Set<string>();
          hierarchy.forEach(emp => {
            if (emp.subordinates && emp.subordinates.length > 0) {
              firstLevelIds.add(emp.id);
            }
          });
          setExpandedNodes(firstLevelIds);
        } else {
          console.error('Error fetching employees:', error);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [buildHierarchy]);

  // Mettre à jour les nœuds et arêtes quand les données changent
  useEffect(() => {
    if (employees.length > 0) {
      const { nodes: newNodes, edges: newEdges } = calculateHierarchicalLayout(employees);
      
      // Ajouter la fonction de toggle aux données des nœuds
      const nodesWithToggle = newNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onToggleExpand: toggleExpanded,
          isExpanded: expandedNodes.has(node.id),
        },
      }));
      
      setNodes(nodesWithToggle);
      setEdges(newEdges);
    }
  }, [employees, expandedNodes]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allIds = new Set<string>();
    const collectIds = (emps: Employee[]) => {
      emps.forEach(emp => {
        if (emp.subordinates && emp.subordinates.length > 0) {
          allIds.add(emp.id);
          collectIds(emp.subordinates);
        }
      });
    };
    collectIds(employees);
    setExpandedNodes(allIds);
  }, [employees]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  const resetLayout = useCallback(() => {
    if (employees.length > 0) {
      const { nodes: newNodes, edges: newEdges } = calculateHierarchicalLayout(employees);
      const nodesWithToggle = newNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onToggleExpand: toggleExpanded,
          isExpanded: expandedNodes.has(node.id),
        },
      }));
      setNodes(nodesWithToggle);
      setEdges(newEdges);
    }
  }, [employees, expandedNodes, toggleExpanded]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const downloadImage = useCallback(() => {
    // TODO: Implémenter l'export d'image
    console.log('Export d\'image à implémenter');
  }, []);

  if (loading) {
    return (
      <Card className="w-full h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <Users className="h-12 w-12 text-gray-400" />
            <div className="text-gray-500">Chargement de l'organigramme...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (employees.length === 0) {
    return (
      <Card className="w-full h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500">Aucun employé trouvé</div>
            <div className="text-sm text-gray-400 mt-2">
              Vérifiez la configuration de votre base de données
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-[800px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Organigramme Interactif (React Flow)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {nodes.length} employé{nodes.length > 1 ? 's' : ''}
            </Badge>
            <Button variant="outline" size="sm" onClick={expandAll}>
              <Plus className="h-4 w-4 mr-1" />
              Tout Développer
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              <Minus className="h-4 w-4 mr-1" />
              Tout Réduire
            </Button>
            <Button variant="outline" size="sm" onClick={resetLayout}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Réinitialiser
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-full p-0">
        <div className="w-full h-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            attributionPosition="bottom-left"
            className="bg-gray-50 dark:bg-gray-900"
          >
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={20} 
              size={1}
              color="#94a3b8"
            />
            <Controls 
              position="top-left"
              showInteractive={false}
            />
            <MiniMap 
              position="top-right"
              nodeColor={(node) => {
                const data = node.data as unknown as EmployeeNodeData;
                if (data.isDirector) return '#9333ea';
                if (data.isManager) return '#3b82f6';
                return '#6b7280';
              }}
              maskColor="rgba(255, 255, 255, 0.1)"
            />
            
            {/* Panel de légende */}
            <Panel position="bottom-right" className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border shadow-lg">
              <h4 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">Légende</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600"></div>
                  <span className="text-gray-600 dark:text-gray-400">Direction</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600"></div>
                  <span className="text-gray-600 dark:text-gray-400">Manager</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-gray-500 to-gray-600"></div>
                  <span className="text-gray-600 dark:text-gray-400">Employé</span>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant wrapper avec le provider
export const EnterpriseOrgChart: React.FC = () => {
  return (
    <DiagramProvider 
      config={{
        type: 'org_chart',
        layout: 'hierarchical',
        interactions: {
          draggable: true,
          connectable: false,
          deletable: false,
          selectable: true,
        },
        styling: {
          theme: 'enterprise',
        },
      }}
    >
      <ReactFlowOrgChart />
    </DiagramProvider>
  );
};

export default EnterpriseOrgChart;
