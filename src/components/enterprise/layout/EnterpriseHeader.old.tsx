/**
 * === ENTERPRISE HEADER COMPONENT ===
 * Header enterprise avec recherche globale, notifications et profil utilisateur
 */

import React, { useState } from 'react';
import { Search, Bell, User as UserIcon, Settings, Menu, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTheme } from 'next-themes';
import type { ModuleType, User } from '../../../types/enterprise';

// === TYPES === //

interface EnterpriseHeaderProps {
  readonly currentUser: User;
  readonly currentModule: ModuleType;
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
  const { theme, setTheme } = useTheme();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implémenter la recherche globale
    console.log('Search:', searchValue);
  };

  const getModuleTitle = (module: ModuleType): string => {
    const titles: Record<ModuleType, string> = {
      dashboard: 'Tableau de bord',
      hr: 'Ressources Humaines',
      business: 'Business Intelligence',
      support: 'Support Client',
      admin: 'Administration',
      analytics: 'Analytics'
    };
    return titles[module];
  };

  const getUserInitials = (user: User): string => {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <header className={cn(
      'flex h-16 items-center justify-between px-6 bg-white dark:bg-enterprise-neutral-900 border-b border-enterprise-neutral-200 dark:border-enterprise-neutral-700',
      className
    )}>
      
      {/* Section gauche : Menu toggle + Breadcrumb */}
      <div className="flex items-center gap-4">
        {onSidebarToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSidebarToggle}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        )}
        
        <div className="hidden md:block">
          <h1 className="text-xl font-semibold text-enterprise-neutral-900 dark:text-white">
            {getModuleTitle(currentModule)}
          </h1>
        </div>
      </div>

      {/* Section centrale : Recherche */}
      <div className="flex-1 max-w-md mx-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-enterprise-neutral-500 dark:text-enterprise-neutral-400" />
          <Input
            type="search"
            placeholder="Rechercher..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 w-full bg-enterprise-neutral-50 dark:bg-enterprise-neutral-800 border-enterprise-neutral-200 dark:border-enterprise-neutral-700"
          />
        </form>
      </div>

      {/* Section droite : Actions + Profil */}
      <div className="flex items-center gap-2">
        
        {/* Toggle Dark Mode */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-9 w-9"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 w-9 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-3 border-b">
              <h3 className="font-semibold">Notifications</h3>
            </div>
            <div className="p-2">
              <div className="text-sm text-enterprise-neutral-600 dark:text-enterprise-neutral-400 text-center py-4">
                Aucune nouvelle notification
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profil utilisateur */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatarUrl} alt={`${currentUser.firstName} ${currentUser.lastName}`} />
                <AvatarFallback className="bg-enterprise-accent-600 text-white">
                  {getUserInitials(currentUser)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center justify-start gap-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatarUrl} alt={`${currentUser.firstName} ${currentUser.lastName}`} />
                <AvatarFallback className="bg-enterprise-accent-600 text-white">
                  {getUserInitials(currentUser)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-0.5 leading-none">
                <p className="font-medium text-sm">
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                <p className="w-[200px] truncate text-xs text-enterprise-neutral-500 dark:text-enterprise-neutral-400">
                  {currentUser.email}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Paramètres</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 dark:text-red-400">
              <span>Se déconnecter</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default EnterpriseHeader;
