
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, Building2, Mail, Phone } from 'lucide-react';

const employeeSchema = z.object({
  first_name: z.string().min(2, 'Prénom requis (min 2 caractères)'),
  last_name: z.string().min(2, 'Nom requis (min 2 caractères)'),
  employee_number: z.string().min(3, 'Numéro employé requis'),
  work_email: z.string().email('Email professionnel invalide').optional().or(z.literal('')),
  personal_phone: z.string().optional(),
  hire_date: z.string().min(1, 'Date d\'embauche requise'),
  employment_status: z.enum(['active', 'inactive', 'terminated']),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'intern']),
  current_salary: z.number().min(0, 'Salaire doit être positif').optional(),
  department_id: z.string().min(1, 'Département requis'),
  position_id: z.string().min(1, 'Poste requis'),
  branch_id: z.string().min(1, 'Filiale requise'),
  skills: z.string().optional(),
  performance_score: z.number().min(1).max(10).optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  employee?: any;
  departments: any[];
  positions: any[];
  branches: any[];
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employee,
  departments,
  positions,
  branches,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee ? {
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      employee_number: employee.employee_number || '',
      work_email: employee.work_email || '',
      personal_phone: employee.personal_phone || '',
      hire_date: employee.hire_date || '',
      employment_status: employee.employment_status || 'active',
      employment_type: employee.employment_type || 'full_time',
      current_salary: employee.current_salary || 0,
      department_id: employee.department_id || '',
      position_id: employee.position_id || '',
      branch_id: employee.branch_id || '',
      skills: Array.isArray(employee.skills) ? employee.skills.join(', ') : '',
      performance_score: employee.performance_score || 5,
    } : {
      employment_status: 'active',
      employment_type: 'full_time',
      performance_score: 5,
    },
  });

  const handleFormSubmit = async (data: EmployeeFormData) => {
    const transformedData = {
      ...data,
      current_salary: data.current_salary || 0,
      performance_score: data.performance_score || 5,
    };
    await onSubmit(transformedData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <User className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">
          {employee ? 'Modifier l\'employé' : 'Nouvel employé'}
        </h2>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Prénom *</Label>
              <Input
                id="first_name"
                {...register('first_name')}
                className={errors.first_name ? 'border-red-500' : ''}
              />
              {errors.first_name && (
                <p className="text-sm text-red-500 mt-1">{errors.first_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="last_name">Nom *</Label>
              <Input
                id="last_name"
                {...register('last_name')}
                className={errors.last_name ? 'border-red-500' : ''}
              />
              {errors.last_name && (
                <p className="text-sm text-red-500 mt-1">{errors.last_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="employee_number">Numéro employé *</Label>
              <Input
                id="employee_number"
                {...register('employee_number')}
                className={errors.employee_number ? 'border-red-500' : ''}
              />
              {errors.employee_number && (
                <p className="text-sm text-red-500 mt-1">{errors.employee_number.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="hire_date">Date d'embauche *</Label>
              <div className="relative">
                <Input
                  id="hire_date"
                  type="date"
                  {...register('hire_date')}
                  className={errors.hire_date ? 'border-red-500' : ''}
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.hire_date && (
                <p className="text-sm text-red-500 mt-1">{errors.hire_date.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="work_email">Email professionnel</Label>
              <div className="relative">
                <Input
                  id="work_email"
                  type="email"
                  {...register('work_email')}
                  className={errors.work_email ? 'border-red-500' : ''}
                />
                <Mail className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.work_email && (
                <p className="text-sm text-red-500 mt-1">{errors.work_email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="personal_phone">Téléphone personnel</Label>
              <div className="relative">
                <Input
                  id="personal_phone"
                  {...register('personal_phone')}
                />
                <Phone className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations professionnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informations professionnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="branch_id">Filiale *</Label>
              <Select onValueChange={(value) => setValue('branch_id', value)} defaultValue={watch('branch_id')}>
                <SelectTrigger className={errors.branch_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Sélectionner une filiale" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.branch_id && (
                <p className="text-sm text-red-500 mt-1">{errors.branch_id.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="department_id">Département *</Label>
              <Select onValueChange={(value) => setValue('department_id', value)} defaultValue={watch('department_id')}>
                <SelectTrigger className={errors.department_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Sélectionner un département" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department_id && (
                <p className="text-sm text-red-500 mt-1">{errors.department_id.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="position_id">Poste *</Label>
              <Select onValueChange={(value) => setValue('position_id', value)} defaultValue={watch('position_id')}>
                <SelectTrigger className={errors.position_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Sélectionner un poste" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.position_id && (
                <p className="text-sm text-red-500 mt-1">{errors.position_id.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="employment_status">Statut</Label>
              <Select onValueChange={(value) => setValue('employment_status', value as any)} defaultValue={watch('employment_status')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="terminated">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="employment_type">Type d'emploi</Label>
              <Select onValueChange={(value) => setValue('employment_type', value as any)} defaultValue={watch('employment_type')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Temps plein</SelectItem>
                  <SelectItem value="part_time">Temps partiel</SelectItem>
                  <SelectItem value="contract">Contractuel</SelectItem>
                  <SelectItem value="intern">Stagiaire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="current_salary">Salaire (XOF)</Label>
              <Input
                id="current_salary"
                type="number"
                {...register('current_salary', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="performance_score">Score Performance (1-10)</Label>
              <Input
                id="performance_score"
                type="number"
                min="1"
                max="10"
                {...register('performance_score', { valueAsNumber: true })}
                placeholder="5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Compétences */}
        <Card>
          <CardHeader>
            <CardTitle>Compétences</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="skills">Compétences (séparées par des virgules)</Label>
              <Textarea
                id="skills"
                {...register('skills')}
                placeholder="JavaScript, React, Leadership, Gestion d'équipe..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Sauvegarde...' : (employee ? 'Mettre à jour' : 'Créer l\'employé')}
          </Button>
        </div>
      </form>
    </div>
  );
};
