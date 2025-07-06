import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Users, User, Crown, Building2, Plus, Minus, ExternalLink } from 'lucide-react';

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

// Composant pour un nœud d'employé style officiel
const OfficialNode: React.FC<{
  employee: Employee;
  level: number;
  hasSubordinates: boolean;
  isExpanded: boolean;
  onViewProfile: (id: string) => void;
  onToggleExpand: (id: string) => void;
}> = ({ employee, level, hasSubordinates, isExpanded, onViewProfile, onToggleExpand }) => {
  return (
    <div className="relative flex flex-col items-center">
      <Card className="w-52 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow group">
        <CardContent className="p-4">
          <div className="text-center">
            {/* Avatar officiel */}
            <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center border-2 ${
              level === 0 ? 'bg-blue-900 border-blue-700 text-white' : 
              hasSubordinates ? 'bg-blue-700 border-blue-500 text-white' : 
              'bg-gray-600 border-gray-400 text-white'
            }`}>
              {level === 0 ? (
                <Crown className="h-5 w-5" />
              ) : hasSubordinates ? (
                <Users className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            
            {/* Nom */}
            <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-gray-100">
              {employee.first_name} {employee.last_name}
            </h4>
            
            {/* Poste */}
            <Badge variant="secondary" className="text-xs px-3 py-1 mb-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              {employee.positions?.title}
            </Badge>
            
            {/* Département */}
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              <div className="flex items-center justify-center gap-1">
                <Building2 className="h-3 w-3" />
                <span>{employee.departments?.name}</span>
              </div>
            </div>

            {/* Nombre de subordonnés pour les managers */}
            {hasSubordinates && (
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {employee.subordinates?.length} équipier{(employee.subordinates?.length || 0) > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </CardContent>

        {/* Boutons d'action - apparaissent au survol */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          {/* Bouton voir fiche */}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile(employee.id);
            }}
            className="h-6 w-6 p-0 rounded-full bg-white/90 dark:bg-gray-800/90 border shadow-sm hover:shadow-md"
            title="Voir la fiche"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          
          {/* Bouton développer/réduire pour les managers */}
          {hasSubordinates && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(employee.id);
              }}
              className="h-6 w-6 p-0 rounded-full bg-white/90 dark:bg-gray-800/90 border shadow-sm hover:shadow-md"
              title={isExpanded ? "Réduire l'équipe" : "Développer l'équipe"}
            >
              {isExpanded ? (
                <Minus className="h-3 w-3" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

// Composant pour les connexions hiérarchiques avec flèches
const HierarchyConnections: React.FC<{
  parentX: number;
  parentY: number;
  children: { x: number; y: number }[];
  isVisible: boolean;
}> = ({ parentX, parentY, children, isVisible }) => {
  if (!isVisible || children.length === 0) return null;

  const connectionY = parentY + 90; // Position du bas de la carte parent
  const childConnectionY = children[0].y - 10; // Position du haut des cartes enfants
  const midY = connectionY + (childConnectionY - connectionY) / 2;

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <defs>
        {/* Flèche pour les connexions */}
        <marker
          id="arrowhead-official"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
          fill="#374151"
        >
          <polygon points="0 0, 8 3, 0 6" />
        </marker>
      </defs>
      
      {/* Ligne verticale principale du parent */}
      <line
        x1={parentX}
        y1={connectionY}
        x2={parentX}
        y2={midY}
        stroke="#374151"
        strokeWidth="2"
        className="drop-shadow-sm"
      />

      {/* Ligne horizontale reliant tous les enfants (si plusieurs) */}
      {children.length > 1 && (
        <line
          x1={Math.min(...children.map(c => c.x))}
          y1={midY}
          x2={Math.max(...children.map(c => c.x))}
          y2={midY}
          stroke="#374151"
          strokeWidth="2"
          className="drop-shadow-sm"
        />
      )}

      {/* Lignes verticales vers chaque enfant avec flèches */}
      {children.map((child, index) => (
        <line
          key={index}
          x1={child.x}
          y1={midY}
          x2={child.x}
          y2={childConnectionY}
          stroke="#374151"
          strokeWidth="2"
          markerEnd="url(#arrowhead-official)"
          className="drop-shadow-sm"
        />
      ))}
    </svg>
  );
};

// Composant pour organiser un niveau hiérarchique
const HierarchyLevel: React.FC<{
  employees: Employee[];
  level: number;
  expandedNodes: Set<string>;
  onViewProfile: (id: string) => void;
  onToggleExpand: (id: string) => void;
  parentPosition?: { x: number; y: number };
}> = ({ employees, level, expandedNodes, onViewProfile, onToggleExpand, parentPosition }) => {
  const CARD_WIDTH = 220;
  const CARD_SPACING = 40;
  const LEVEL_HEIGHT = 180;

  // Calculer les positions pour ce niveau
  const totalWidth = employees.length * CARD_WIDTH + (employees.length - 1) * CARD_SPACING;
  const startX = parentPosition ? parentPosition.x - totalWidth / 2 : -totalWidth / 2;
  const currentY = level * LEVEL_HEIGHT + 50;

  const positions = employees.map((_, index) => ({
    x: startX + index * (CARD_WIDTH + CARD_SPACING) + CARD_WIDTH / 2,
    y: currentY
  }));

  return (
    <div className="relative">
      {/* Connexions depuis le parent */}
      {parentPosition && (
        <HierarchyConnections
          parentX={parentPosition.x}
          parentY={parentPosition.y}
          children={positions}
          isVisible={true}
        />
      )}

      {/* Nœuds de ce niveau */}
      {employees.map((employee, index) => {
        const position = positions[index];
        const hasSubordinates = employee.subordinates && employee.subordinates.length > 0;
        const isExpanded = expandedNodes.has(employee.id);

        return (
          <div key={employee.id}>
            {/* Nœud de l'employé */}
            <div
              className="absolute"
              style={{
                left: position.x - CARD_WIDTH / 2,
                top: position.y,
                zIndex: 10
              }}
            >
              <OfficialNode
                employee={employee}
                level={level}
                hasSubordinates={hasSubordinates}
                isExpanded={isExpanded}
                onViewProfile={onViewProfile}
                onToggleExpand={onToggleExpand}
              />
            </div>

            {/* Niveaux subordonnés */}
            {hasSubordinates && isExpanded && employee.subordinates && (
              <HierarchyLevel
                employees={employee.subordinates}
                level={level + 1}
                expandedNodes={expandedNodes}
                onViewProfile={onViewProfile}
                onToggleExpand={onToggleExpand}
                parentPosition={{ x: position.x, y: position.y }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export const ConventionalOrgChart: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

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

  const handleViewProfile = (employeeId: string) => {
    // TODO: Navigation vers la fiche employé
    console.log('View profile for employee:', employeeId);
    // Ici on pourrait utiliser le router pour naviguer vers /hr/employees/{id}
  };

  // Calculer les dimensions du canvas
  const calculateCanvasDimensions = () => {
    const maxWidth = 1200;
    const maxDepth = 5; // Estimation de la profondeur max
    return {
      width: maxWidth,
      height: maxDepth * 180 + 100,
      offsetX: maxWidth / 2,
      offsetY: 0
    };
  };

  const dimensions = calculateCanvasDimensions();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Organigramme Hiérarchique
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              <Plus className="h-4 w-4 mr-1" />
              Étendre Tout
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              <Minus className="h-4 w-4 mr-1" />
              Réduire Tout
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <Building2 className="h-12 w-12 text-gray-400" />
              <div className="text-gray-500">Chargement de l'organigramme...</div>
            </div>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500">Aucun employé trouvé</div>
              <div className="text-sm text-gray-400 mt-2">Vérifiez la configuration de votre base de données</div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-auto border rounded-lg bg-gray-50 dark:bg-gray-900">
            <div 
              className="relative"
              style={{ 
                width: dimensions.width, 
                height: dimensions.height,
                minHeight: '500px'
              }}
            >            <HierarchyLevel
              employees={employees}
              level={0}
              expandedNodes={expandedNodes}
              onViewProfile={handleViewProfile}
              onToggleExpand={toggleExpanded}
            />
              
              {/* Légende */}
              <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg p-4 border shadow-lg">
                <h4 className="font-semibold text-sm mb-3 text-gray-800 dark:text-gray-200">Hiérarchie</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-900 flex items-center justify-center">
                      <Crown className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">Direction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center">
                      <Users className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">Manager</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
                      <User className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">Employé</span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-gray-600"></div>
                      <span className="text-gray-600 dark:text-gray-400">Lien hiérarchique</span>
                    </div>
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

export default ConventionalOrgChart;
