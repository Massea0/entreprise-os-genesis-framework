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
  
  const [aiGeneration, setAiGeneration] = useState({
    enabled: false,
    loading: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (aiGeneration.enabled && formData.name && formData.client_company_id && !project) {
      // Mode IA activé - générer le projet avec l'IA
      await handleAiProjectGeneration();
    } else {
      // Mode normal
      onSave({
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        start_date: formData.start_date?.toISOString(),
        end_date: formData.end_date?.toISOString()
      });
    }
  };

  const handleAiProjectGeneration = async () => {
    try {
      setAiGeneration(prev => ({ ...prev, loading: true }));
      
      // Récupérer les infos client
      const selectedCompany = companies.find(c => c.id === formData.client_company_id);
      const clientType = selectedCompany ? 'Entreprise' : 'Standard';
      
      // Générer avec l'IA si description courte, sinon utiliser la description fournie
      const needsAiDescription = !formData.description || formData.description.length < 20;
      const projectDescription = needsAiDescription 
        ? `Projet ${formData.name} pour le client ${selectedCompany?.name || 'Non spécifié'}`
        : formData.description;

      // Appel à l'edge function project-planner-ai
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: aiPlan, error: aiError } = await supabase.functions.invoke('project-planner-ai', {
        body: {
          name: formData.name,
          description: projectDescription,
          budget: formData.budget ? parseFloat(formData.budget) : 2000000,
          clientType,
          industry: 'Général'
        }
      });

      if (aiError) throw aiError;

      // Créer le projet avec les données IA
      const projectData = {
        ...formData,
        description: aiPlan.data.phases?.map(p => p.description).join(' | ') || projectDescription,
        budget: aiPlan.data.estimatedBudget || (formData.budget ? parseFloat(formData.budget) : null),
        start_date: formData.start_date?.toISOString() || new Date().toISOString(),
        end_date: formData.end_date?.toISOString() || new Date(Date.now() + (aiPlan.data.totalEstimatedDuration || 30) * 24 * 60 * 60 * 1000).toISOString(),
        aiGenerated: true,
        aiPlan: aiPlan.data
      };

      onSave(projectData);
    } catch (error) {
      console.error('Erreur génération IA:', error);
      // Fallback vers création normale en cas d'erreur
      onSave({
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        start_date: formData.start_date?.toISOString(),
        end_date: formData.end_date?.toISOString()
      });
    } finally {
      setAiGeneration(prev => ({ ...prev, loading: false }));
    }
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

        {/* Mode IA */}
        {!project && (
          <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-blue-900">🤖 Génération IA</h3>
                <p className="text-sm text-blue-700">
                  Laissez l'IA créer automatiquement le plan complet du projet
                </p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiGeneration.enabled}
                  onChange={(e) => setAiGeneration(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="sr-only"
                />
                <div className={`relative w-11 h-6 rounded-full transition-colors ${
                  aiGeneration.enabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    aiGeneration.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </label>
            </div>
            
            {aiGeneration.enabled && (
              <div className="text-sm text-blue-800 bg-blue-100 p-3 rounded-md">
                <p className="font-medium mb-1">Mode IA activé !</p>
                <p>Il suffit de renseigner le <strong>nom du projet</strong> et le <strong>client</strong>. L'IA se chargera de :</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Générer une description détaillée</li>
                  <li>Estimer le budget et les délais</li>
                  <li>Créer automatiquement les tâches et phases</li>
                  <li>Assigner les ressources appropriées</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={aiGeneration.loading}>
            {aiGeneration.loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                IA en cours...
              </>
            ) : (
              <>
                {aiGeneration.enabled && '🤖 '}
                {project ? 'Modifier' : (aiGeneration.enabled ? 'Créer avec IA' : 'Créer')}
              </>
            )}
          </Button>
        </div>
    </form>
  );
};