import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  client_company_id?: string;
  owner_id?: string;
}

interface Company {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  user_id?: string;
}

interface ProjectFormProps {
  project?: Project;
  companies: Company[];
  employees: Employee[];
  onSave: (projectData: any) => void;
  onCancel: () => void;
}

const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planification' },
  { value: 'active', label: 'En cours' },
  { value: 'on_hold', label: 'En pause' },
  { value: 'completed', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' }
];

export const ProjectForm = ({ 
  project, 
  companies, 
  employees, 
  onSave, 
  onCancel 
}: ProjectFormProps) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'planning',
    start_date: project?.start_date ? new Date(project.start_date) : undefined,
    end_date: project?.end_date ? new Date(project.end_date) : undefined,
    budget: project?.budget?.toString() || '',
    client_company_id: project?.client_company_id || '',
    owner_id: project?.owner_id || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      start_date: formData.start_date?.toISOString(),
      end_date: formData.end_date?.toISOString()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom du projet *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Statut</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date de début</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.start_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.start_date ? (
                  format(formData.start_date, "dd MMM yyyy", { locale: fr })
                ) : (
                  <span>Sélectionner une date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.start_date}
                onSelect={(date) => setFormData({ ...formData, start_date: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Date de fin</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.end_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.end_date ? (
                  format(formData.end_date, "dd MMM yyyy", { locale: fr })
                ) : (
                  <span>Sélectionner une date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.end_date}
                onSelect={(date) => setFormData({ ...formData, end_date: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budget">Budget (XOF)</Label>
          <Input
            id="budget"
            type="number"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_company_id">Client</Label>
          <Select 
            value={formData.client_company_id} 
            onValueChange={(value) => setFormData({ ...formData, client_company_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un client" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="owner_id">Chef de projet</Label>
        <Select 
          value={formData.owner_id} 
          onValueChange={(value) => setFormData({ ...formData, owner_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un chef de projet" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={emp.user_id || emp.id}>
                {emp.first_name} {emp.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {project ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
};