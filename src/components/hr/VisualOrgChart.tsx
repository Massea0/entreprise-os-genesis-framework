import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Users, User, Crown, Building2, MapPin, ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react';

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

// Composant pour un nœud d'employé style arbre généalogique
const GenealogyNode: React.FC<{
  employee: Employee;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
  hasSubordinates: boolean;
  isLast?: boolean;
  isFirst?: boolean;
}> = ({ employee, level, isExpanded, onToggle, hasSubordinates, isLast = false, isFirst = false }) => {
  return (
    <div className="relative flex flex-col items-center">
      {/* Carte employé compacte style généalogique */}
      <div className="relative">
        <Card className={`w-48 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105 ${
          level === 0 ? 'border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20' :
          hasSubordinates ? 'border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20' :
          'border border-gray-300 bg-white dark:bg-gray-800'
        }`}>
          <CardContent className="p-3">
            <div className="text-center">
              {/* Avatar compact */}
              <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center shadow-md ${
                level === 0 ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 
                hasSubordinates ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' : 
                'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
              }`}>
                {level === 0 ? (
                  <Crown className="h-5 w-5" />
                ) : hasSubordinates ? (
                  <Users className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              
              {/* Nom compact */}
              <h4 className="font-semibold text-sm mb-1 leading-tight">
                {employee.first_name} {employee.last_name}
              </h4>
              
              {/* Poste compact */}
              <Badge variant="secondary" className="text-xs px-2 py-0.5 mb-1">
                {employee.positions?.title}
              </Badge>
              
              {/* Infos minimales */}
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div className="flex items-center justify-center gap-1">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate max-w-24">{employee.departments?.name}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bouton expand/collapse intégré */}
        {hasSubordinates && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggle}
            className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 h-6 w-6 p-0 rounded-full border-2 shadow-md ${
              isExpanded ? 'bg-red-50 border-red-300 hover:bg-red-100' : 'bg-green-50 border-green-300 hover:bg-green-100'
            }`}
          >
            {isExpanded ? (
              <Minus className="h-3 w-3 text-red-600" />
            ) : (
              <Plus className="h-3 w-3 text-green-600" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

// Composant pour les connexions SVG style arbre généalogique
const GenealogyConnections: React.FC<{
  parentX: number;
  parentY: number;
  children: { x: number; y: number }[];
  isVisible: boolean;
}> = ({ parentX, parentY, children, isVisible }) => {
  if (!isVisible || children.length === 0) return null;

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
          className="fill-gray-400"
        >
          <polygon points="0 0, 10 3.5, 0 7" />
        </marker>
      </defs>
      
      {children.map((child, index) => {
        const midY = parentY + (child.y - parentY) / 2;
        
        return (
          <g key={index}>
            {/* Ligne verticale du parent vers le milieu */}
            <line
              x1={parentX}
              y1={parentY + 15}
              x2={parentX}
              y2={midY}
              stroke="#9CA3AF"
              strokeWidth="2"
              className="drop-shadow-sm"
            />
            
            {/* Ligne horizontale vers l'enfant */}
            {children.length > 1 && index === 0 && (
              <line
                x1={Math.min(parentX, ...children.map(c => c.x))}
                y1={midY}
                x2={Math.max(parentX, ...children.map(c => c.x))}
                y2={midY}
                stroke="#9CA3AF"
                strokeWidth="2"
                className="drop-shadow-sm"
              />
            )}
            
            {/* Ligne verticale du milieu vers l'enfant */}
            <line
              x1={child.x}
              y1={midY}
              x2={child.x}
              y2={child.y - 15}
              stroke="#9CA3AF"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
              className="drop-shadow-sm"
            />
          </g>
        );
      })}
    </svg>
  );
};

// Composant principal de l'arbre généalogique
const GenealogyBranch: React.FC<{
  employee: Employee;
  level: number;
  expandedNodes: Set<string>;
  onToggle: (id: string) => void;
  position: { x: number; y: number };
  onPositionUpdate: (id: string, position: { x: number; y: number }) => void;
}> = ({ employee, level, expandedNodes, onToggle, position, onPositionUpdate }) => {
  const hasSubordinates = employee.subordinates && employee.subordinates.length > 0;
  const isExpanded = expandedNodes.has(employee.id);
  const subordinates = employee.subordinates || [];
  
  const nodeWidth = 200;
  const nodeHeight = 120;
  const levelGap = 150;

  // Calculer les positions des enfants
  const childrenPositions = subordinates.map((_, index) => {
    const totalWidth = (subordinates.length - 1) * nodeWidth;
    const startX = position.x - totalWidth / 2;
    return {
      x: startX + index * nodeWidth,
      y: position.y + levelGap
    };
  });

  // Notifier la position de ce nœud
  React.useEffect(() => {
    onPositionUpdate(employee.id, position);
  }, [employee.id, position, onPositionUpdate]);

  return (
    <div className="relative">
      {/* Nœud de l'employé */}
      <div 
        className="absolute"
        style={{ 
          left: position.x - nodeWidth / 2, 
          top: position.y,
          zIndex: 10 
        }}
      >
        <GenealogyNode
          employee={employee}
          level={level}
          isExpanded={isExpanded}
          onToggle={() => onToggle(employee.id)}
          hasSubordinates={hasSubordinates}
        />
      </div>

      {/* Connexions vers les enfants */}
      {hasSubordinates && isExpanded && (
        <>
          <GenealogyConnections
            parentX={position.x}
            parentY={position.y}
            children={childrenPositions}
            isVisible={true}
          />

          {/* Nœuds des enfants */}
          {subordinates.map((subordinate, index) => (
            <GenealogyBranch
              key={subordinate.id}
              employee={subordinate}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              position={childrenPositions[index]}
              onPositionUpdate={onPositionUpdate}
            />
          ))}
        </>
      )}
    </div>
  );
};

export const VisualOrgChart: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  // Fonction pour construire la hiérarchie
  const buildHierarchy = (employeeList: any[]): Employee[] => {
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
  };

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
  }, []);

  const toggleExpanded = (id: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const expandAll = () => {
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
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const updateNodePosition = (id: string, position: { x: number; y: number }) => {
    setNodePositions(prev => new Map(prev.set(id, position)));
  };

  // Calculer les dimensions du canvas
  const calculateCanvasDimensions = () => {
    if (nodePositions.size === 0) return { width: 800, height: 600 };
    
    const positions = Array.from(nodePositions.values());
    const minX = Math.min(...positions.map(p => p.x)) - 150;
    const maxX = Math.max(...positions.map(p => p.x)) + 150;
    const minY = Math.min(...positions.map(p => p.y)) - 50;
    const maxY = Math.max(...positions.map(p => p.y)) + 150;
    
    return {
      width: Math.max(800, maxX - minX),
      height: Math.max(600, maxY - minY),
      offsetX: -minX,
      offsetY: -minY
    };
  };

  const dimensions = calculateCanvasDimensions();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Arbre Généalogique RH
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              <Plus className="h-4 w-4 mr-1" />
              Tout Développer
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              <Minus className="h-4 w-4 mr-1" />
              Tout Réduire
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <Users className="h-12 w-12 text-gray-400" />
              <div className="text-gray-500">Construction de l'arbre généalogique...</div>
            </div>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500">Aucun employé trouvé</div>
              <div className="text-sm text-gray-400 mt-2">Vérifiez la configuration de votre base de données</div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-auto border rounded-lg bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900/20">
            <div 
              className="relative"
              style={{ 
                width: dimensions.width, 
                height: dimensions.height,
                minHeight: '400px'
              }}
            >
              {employees.map((employee, index) => (
                <GenealogyBranch
                  key={employee.id}
                  employee={employee}
                  level={0}
                  expandedNodes={expandedNodes}
                  onToggle={toggleExpanded}
                  position={{ 
                    x: (dimensions.offsetX || 0) + (index * 300) + 150, 
                    y: (dimensions.offsetY || 0) + 50 
                  }}
                  onPositionUpdate={updateNodePosition}
                />
              ))}
              
              {/* Légende */}
              <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 border shadow-lg">
                <h4 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">Légende</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                      <Crown className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">Direction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
                      <Users className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">Manager</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center">
                      <User className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">Employé</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VisualOrgChart;
