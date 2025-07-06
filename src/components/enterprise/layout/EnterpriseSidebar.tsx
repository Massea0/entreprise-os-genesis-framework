/**
 * === ENTERPRISE SIDEBAR COMPONENT ===
 * Sidebar modulaire pour l'interface enterprise
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  Briefcase, 
  BarChart3, 
  Settings, 
  Menu,
  X
} from 'lucide-react';
import type { ModuleType } from '../../../types/enterprise';

interface EnterpriseSidebarProps {
  currentModule: ModuleType;
  userRole: string;
  onModuleChange: (module: ModuleType) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const modules = [
  { id: 'dashboard' as ModuleType, label: 'Dashboard', icon: BarChart3 },
  { id: 'rh' as ModuleType, label: 'Ressources Humaines', icon: Users },
  { id: 'business' as ModuleType, label: 'Business', icon: Briefcase },
  { id: 'projects' as ModuleType, label: 'Projets', icon: Building2 },
];

export const EnterpriseSidebar: React.FC<EnterpriseSidebarProps> = ({
  currentModule,
  userRole,
  onModuleChange,
  isCollapsed,
  onToggleCollapse,
}) => {
  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Enterprise OS
            </h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-2"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {modules.map((module) => {
          const Icon = module.icon;
          const isActive = currentModule === module.id;
          
          return (
            <Button
              key={module.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                'w-full justify-start gap-3',
                isCollapsed && 'px-2',
                isActive && 'bg-primary text-primary-foreground'
              )}
              onClick={() => onModuleChange(module.id)}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span>{module.label}</span>}
            </Button>
          );
        })}
      </nav>

      {/* Settings */}
      {!isCollapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Settings className="h-4 w-4" />
            Paramètres
          </Button>
        </div>
      )}
    </div>
  );
};