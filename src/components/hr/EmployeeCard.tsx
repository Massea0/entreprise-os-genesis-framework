
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  TrendingUp,
  MoreVertical 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EmployeeCardProps {
  employee: any;
  onEdit: (employee: any) => void;
  onDelete: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  onEdit,
  onDelete,
  onViewDetails,
}) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'terminated': return 'destructive';
      default: return 'outline';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatSalary = (salary: number) => {
    if (!salary) return null;
    return new Intl.NumberFormat('fr-FR').format(salary) + ' XOF';
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(employee.first_name, employee.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 
                className="font-semibold text-lg cursor-pointer hover:text-primary transition-colors"
                onClick={() => onViewDetails(employee.id)}
              >
                {employee.first_name} {employee.last_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {employee.employee_number}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(employee.employment_status)}>
              {employee.employment_status}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails(employee.id)}>
                  Voir détails
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(employee)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(employee.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Informations principales */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span>{employee.positions?.title || 'Poste non défini'}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{employee.departments?.name || 'Département non défini'}</span>
          </div>

          {employee.work_email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{employee.work_email}</span>
            </div>
          )}

          {employee.personal_phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{employee.personal_phone}</span>
            </div>
          )}
        </div>

        {/* Métriques */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-4 text-sm">
            {employee.performance_score && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium">{employee.performance_score}/10</span>
              </div>
            )}
            
            {employee.current_salary && (
              <div className="font-medium text-primary">
                {formatSalary(employee.current_salary)}
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            Embauché le {new Date(employee.hire_date).toLocaleDateString('fr-FR')}
          </div>
        </div>

        {/* Compétences */}
        {employee.skills && Array.isArray(employee.skills) && employee.skills.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex flex-wrap gap-1">
              {employee.skills.slice(0, 3).map((skill: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {employee.skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{employee.skills.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
