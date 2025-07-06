/**
 * === ENTERPRISE HEADER COMPONENT ===
 * Header enterprise avec recherche globale, notifications et profil utilisateur
 */

import React, { useState } from 'react';
import { Search, Bell, User as UserIcon, Settings, Menu, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// === TYPES === //

interface EnterpriseHeaderProps {
  readonly currentUser?: any;
  readonly currentModule?: string;
  readonly onSidebarToggle?: () => void;
  readonly sidebarCollapsed?: boolean;
  readonly className?: string;
}

// === COMPOSANT PRINCIPAL === //

export const EnterpriseHeader: React.FC<EnterpriseHeaderProps> = ({
  currentUser,
  currentModule,
  onSidebarToggle,
  sidebarCollapsed = false,
  className,
}) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search:', searchValue);
  };

  return (
    <header
      className={cn(
        'h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6',
        className
      )}
    >
      {/* Section gauche - Menu burger + titre */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSidebarToggle}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="hidden lg:block">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {currentModule || 'Entreprise OS'}
          </h1>
        </div>
      </div>

      {/* Section centrale - Recherche */}
      <div className="flex-1 max-w-xl mx-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Rechercher..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 pr-4"
          />
        </form>
      </div>

      {/* Section droite - Actions utilisateur */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            3
          </span>
        </Button>

        <Button variant="ghost" size="sm">
          <UserIcon className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default EnterpriseHeader;