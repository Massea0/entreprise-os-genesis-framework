import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, User, Crown, Building2, ChevronDown, ChevronUp } from 'lucide-react';

export interface EmployeeNodeData {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  branch?: string;
  level: number;
  isManager: boolean;
  isDirector: boolean;
  subordinateCount?: number;
  isExpanded?: boolean;
  onToggleExpand?: (id: string) => void;
  avatar?: string;
}

export const EmployeeNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as EmployeeNodeData;
  const { 
    firstName, 
    lastName, 
    title, 
    department, 
    level, 
    isManager, 
    isDirector, 
    subordinateCount = 0,
    isExpanded = false,
    onToggleExpand,
    id
  } = nodeData;

  const nodeStyle = isDirector 
    ? 'border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20' 
    : isManager 
    ? 'border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20'
    : 'border border-gray-300 bg-white dark:bg-gray-800';

  const avatarStyle = isDirector
    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
    : isManager
    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
    : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';

  const getIcon = () => {
    if (isDirector) return <Crown className="h-4 w-4" />;
    if (isManager) return <Users className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  };

  return (
    <div className="relative">
      {/* Handle d'entrée (venant du manager) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#6366f1',
          width: 8,
          height: 8,
          top: -4,
        }}
      />

      <Card className={`
        w-52 transition-all duration-300 cursor-pointer
        ${nodeStyle}
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        hover:shadow-lg transform hover:scale-105
      `}>
        <CardContent className="p-4">
          <div className="text-center">
            {/* Avatar */}
            <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center shadow-md ${avatarStyle}`}>
              {getIcon()}
            </div>
            
            {/* Nom */}
            <h4 className="font-semibold text-sm mb-2 leading-tight">
              {firstName} {lastName}
            </h4>
            
            {/* Poste */}
            <Badge variant="secondary" className="text-xs px-2 py-1 mb-2 block">
              {title}
            </Badge>
            
            {/* Département */}
            <div className="text-xs text-muted-foreground mb-2">
              <div className="flex items-center justify-center gap-1">
                <Building2 className="h-3 w-3" />
                <span className="truncate">{department}</span>
              </div>
            </div>

            {/* Stats pour les managers */}
            {subordinateCount > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                  {subordinateCount} équipier{subordinateCount > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </CardContent>

        {/* Bouton expand/collapse pour les managers */}
        {subordinateCount > 0 && onToggleExpand && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(id);
            }}
            className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 h-6 w-6 p-0 rounded-full border-2 shadow-md bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        )}
      </Card>

      {/* Handle de sortie (vers les subordonnés) */}
      {subordinateCount > 0 && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: '#6366f1',
            width: 8,
            height: 8,
            bottom: -4,
          }}
        />
      )}
    </div>
  );
};

export default EmployeeNode;
