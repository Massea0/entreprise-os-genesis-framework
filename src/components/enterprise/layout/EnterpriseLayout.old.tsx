/**
 * === ENTERPRISE LAYOUT COMPONENT ===
 * Layout principal pour l'interface enterprise
 * Architecture modulaire avec sidebar, header et zones de contenu
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { EnterpriseHeader } from './EnterpriseHeader';
import { EnterpriseSidebar } from './EnterpriseSidebar';
import type { ModuleType, User } from '../../../types/enterprise';

// === TYPES === //

interface EnterpriseLayoutProps {
  readonly children: React.ReactNode;
  readonly currentUser: User;
  readonly currentModule: ModuleType;
  readonly onModuleChange: (module: ModuleType) => void;
  readonly className?: string;
}

// === COMPOSANT PRINCIPAL === //

export const EnterpriseLayout: React.FC<EnterpriseLayoutProps> = ({
  children,
  currentUser,
  currentModule,
  onModuleChange,
  className,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className={cn('min-h-screen bg-enterprise-neutral-50 dark:bg-enterprise-neutral-950', className)}>
      {/* Layout Grid */}
      <div className="grid grid-cols-[auto_1fr] h-screen">
        {/* Sidebar */}
        <EnterpriseSidebar
          currentModule={currentModule}
          userRole={currentUser.role}
          onModuleChange={onModuleChange}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleSidebarToggle}
        />

        {/* Main Content Area */}
        <div className="flex flex-col overflow-hidden">
          {/* Header */}
          <EnterpriseHeader
            currentUser={currentUser}
            currentModule={currentModule}
            onSidebarToggle={handleSidebarToggle}
            sidebarCollapsed={sidebarCollapsed}
          />

          {/* Content */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseLayout;
