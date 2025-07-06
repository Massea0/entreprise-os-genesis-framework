
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX, TrendingUp, Building2, Briefcase } from 'lucide-react';

interface EmployeeStatsProps {
  employees: any[];
  departments: any[];
  positions: any[];
}

export const EmployeeStats: React.FC<EmployeeStatsProps> = ({
  employees,
  departments,
  positions,
}) => {
  const activeEmployees = employees.filter(emp => emp.employment_status === 'active').length;
  const inactiveEmployees = employees.filter(emp => emp.employment_status === 'inactive').length;
  const terminatedEmployees = employees.filter(emp => emp.employment_status === 'terminated').length;
  
  const avgPerformance = employees.length > 0 
    ? employees.reduce((sum, emp) => sum + (emp.performance_score || 0), 0) / employees.length 
    : 0;

  const totalSalary = employees.reduce((sum, emp) => sum + (emp.current_salary || 0), 0);

  const departmentStats = departments.map(dept => ({
    ...dept,
    count: employees.filter(emp => emp.department_id === dept.id).length,
  })).sort((a, b) => b.count - a.count);

  const stats = [
    {
      title: 'Total Employés',
      value: employees.length,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Employés Actifs',
      value: activeEmployees,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Performance Moyenne',
      value: `${avgPerformance.toFixed(1)}/10`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Masse Salariale',
      value: `${(totalSalary / 1_000_000).toFixed(1)}M XOF`,
      icon: Briefcase,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Répartition par statut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Répartition par Statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Actifs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{activeEmployees}</span>
                  <Badge variant="outline">
                    {employees.length > 0 ? Math.round((activeEmployees / employees.length) * 100) : 0}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Inactifs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{inactiveEmployees}</span>
                  <Badge variant="outline">
                    {employees.length > 0 ? Math.round((inactiveEmployees / employees.length) * 100) : 0}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Terminés</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{terminatedEmployees}</span>
                  <Badge variant="outline">
                    {employees.length > 0 ? Math.round((terminatedEmployees / employees.length) * 100) : 0}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top départements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Top Départements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {departmentStats.slice(0, 5).map((dept, index) => (
                <div key={dept.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                      {index + 1}
                    </div>
                    <span className="truncate">{dept.name}</span>
                  </div>
                  <Badge variant="secondary">
                    {dept.count}
                  </Badge>
                </div>
              ))}
              
              {departmentStats.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun département configuré
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
