
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';

interface EmployeeFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (value: string) => void;
  selectedBranch: string;
  onBranchChange: (value: string) => void;
  departments: any[];
  branches: any[];
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
}

export const EmployeeFilters: React.FC<EmployeeFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedDepartment,
  onDepartmentChange,
  selectedBranch,
  onBranchChange,
  departments,
  branches,
  onReset,
  totalCount,
  filteredCount,
}) => {
  const hasActiveFilters = searchTerm || selectedStatus !== 'all' || selectedDepartment !== 'all' || selectedBranch !== 'all';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un employé (nom, prénom, numéro)..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-2">
            <Select value={selectedStatus} onValueChange={onStatusChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
                <SelectItem value="terminated">Terminés</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Département" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les départements</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBranch} onValueChange={onBranchChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filiale" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les filiales</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={onReset}>
                <X className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>

        {/* Compteur de résultats */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>
              {filteredCount === totalCount 
                ? `${totalCount} employé${totalCount > 1 ? 's' : ''}`
                : `${filteredCount} sur ${totalCount} employé${totalCount > 1 ? 's' : ''}`
              }
            </span>
          </div>
          
          {hasActiveFilters && (
            <span className="text-primary font-medium">
              Filtres actifs
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
