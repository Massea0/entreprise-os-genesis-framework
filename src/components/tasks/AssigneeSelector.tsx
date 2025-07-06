import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  UserPlus, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Target,
  Brain,
  Check,
  ChevronDown
} from 'lucide-react';

interface Employee {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  position_id: string;
  skills: any;
  performance_score: number;
  current_salary: number;
  position?: {
    title: string;
    required_skills: any;
  };
}

interface AssignmentSuggestion {
  employee: Employee;
  confidence_score: number;
  reasons: string[];
  workload_score: number;
  skill_match_score: number;
  performance_bonus: number;
}

interface AssigneeSelectorProps {
  taskId: string;
  currentAssigneeId?: string | null;
  onAssign: (userId: string | null, reason?: string) => void;
  taskSkills?: string[];
  taskComplexity?: number;
  disabled?: boolean;
}

export default function AssigneeSelector({ 
  taskId, 
  currentAssigneeId, 
  onAssign, 
  taskSkills = [], 
  taskComplexity = 3,
  disabled = false 
}: AssigneeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [suggestions, setSuggestions] = useState<AssignmentSuggestion[]>([]);
  const [currentAssignee, setCurrentAssignee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0 && taskId) {
      generateSuggestions();
    }
  }, [employees, taskId, taskSkills, taskComplexity]);

  useEffect(() => {
    if (currentAssigneeId && employees.length > 0) {
      const assignee = employees.find(emp => emp.user_id === currentAssigneeId);
      setCurrentAssignee(assignee || null);
    } else {
      setCurrentAssignee(null);
    }
  }, [currentAssigneeId, employees]);

  const loadEmployees = async () => {
    try {
      const { data: employeesData, error } = await supabase
        .from('employees')
        .select(`
          *,
          position:positions(title, required_skills)
        `)
        .eq('employment_status', 'active');

      if (error) throw error;

      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async () => {
    if (!taskId || employees.length === 0) return;
    
    setSuggesting(true);
    try {
      // Récupérer les données de workload actuelles
      const { data: workloadData } = await supabase
        .from('tasks')
        .select('assignee_id, status, estimated_hours')
        .in('status', ['todo', 'in_progress']);

      // Calculer les suggestions intelligentes
      const suggestions: AssignmentSuggestion[] = [];

      for (const employee of employees) {
        // Calculer le score de workload (moins = mieux)
        const assignedTasks = workloadData?.filter(t => t.assignee_id === employee.user_id) || [];
        const totalHours = assignedTasks.reduce((sum, task) => sum + (task.estimated_hours || 4), 0);
        const workloadScore = Math.max(0, 1 - (totalHours / 40)); // Normaliser sur 40h/semaine

        // Calculer le score de compétences
        const employeeSkills = (employee.skills as string[]) || [];
        const positionSkills = (employee.position?.required_skills as string[]) || [];
        const allEmployeeSkills = [...employeeSkills, ...positionSkills];
        
        const skillMatches = taskSkills.filter(skill => 
          allEmployeeSkills.some(empSkill => 
            empSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(empSkill.toLowerCase())
          )
        ).length;
        
        const skillMatchScore = taskSkills.length > 0 ? skillMatches / taskSkills.length : 0.5;

        // Bonus basé sur la performance
        const performanceBonus = (employee.performance_score || 3) / 5;

        // Score de complexité (employé expérimenté pour tâches complexes)
        const complexityMatch = taskComplexity <= 3 ? 1 : performanceBonus;

        // Score de confiance final
        const confidenceScore = (
          workloadScore * 0.3 +
          skillMatchScore * 0.4 +
          performanceBonus * 0.2 +
          complexityMatch * 0.1
        );

        // Générer les raisons
        const reasons: string[] = [];
        if (skillMatchScore > 0.7) reasons.push(`🎯 Excellente adéquation des compétences (${Math.round(skillMatchScore * 100)}%)`);
        if (workloadScore > 0.7) reasons.push(`⚡ Charge de travail optimale (${totalHours}h/sem)`);
        if (performanceBonus > 0.8) reasons.push(`⭐ Performance exceptionnelle (${employee.performance_score}/5)`);
        if (skillMatches > 0) reasons.push(`✅ ${skillMatches} compétence(s) requise(s) maîtrisée(s)`);
        if (totalHours === 0) reasons.push(`🆕 Disponible immédiatement`);
        if (employee.position?.title) reasons.push(`💼 ${employee.position.title}`);

        if (reasons.length === 0) {
          reasons.push(`👤 Employé qualifié disponible`);
        }

        suggestions.push({
          employee,
          confidence_score: confidenceScore,
          reasons,
          workload_score: workloadScore,
          skill_match_score: skillMatchScore,
          performance_bonus: performanceBonus
        });
      }

      // Trier par score de confiance et garder les 5 meilleurs
      const topSuggestions = suggestions
        .sort((a, b) => b.confidence_score - a.confidence_score)
        .slice(0, 5);

      setSuggestions(topSuggestions);

      // Sauvegarder les suggestions en base pour l'IA
      if (topSuggestions.length > 0) {
        await supabase
          .from('task_assignment_suggestions')
          .upsert(
            topSuggestions.map(suggestion => ({
              task_id: taskId,
              suggested_assignee: suggestion.employee.user_id,
              confidence_score: suggestion.confidence_score,
              suggestion_reasons: suggestion.reasons
            })),
            { onConflict: 'task_id,suggested_assignee' }
          );
      }

    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setSuggesting(false);
    }
  };

  const handleAssign = async (employee: Employee | null, reason?: string) => {
    try {
      const userId = employee?.user_id || null;
      
      // Appel direct à onAssign qui gère la mise à jour
      await onAssign(userId, reason);

      // Marquer la suggestion comme appliquée si c'était une suggestion
      if (employee && suggestions.some(s => s.employee.id === employee.id)) {
        await supabase
          .from('task_assignment_suggestions')
          .update({ is_applied: true })
          .eq('task_id', taskId)
          .eq('suggested_assignee', employee.user_id);
      }

      setOpen(false);
      
      toast({
        title: employee ? "Tâche assignée" : "Assignation supprimée",
        description: employee ? 
          `Tâche assignée à ${employee.first_name} ${employee.last_name}` :
          "L'assignation a été supprimée"
      });
    } catch (error) {
      console.error('Error assigning:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de l'assignation"
      });
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-blue-600 bg-blue-50';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent match';
    if (score >= 0.6) return 'Bon match';
    if (score >= 0.4) return 'Match moyen';
    return 'Match faible';
  };

  if (loading) {
    return (
      <Button variant="outline" disabled className="justify-start">
        <User className="h-4 w-4 mr-2" />
        Chargement...
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="justify-start min-w-[200px] max-w-[250px]"
          disabled={disabled}
        >
          {currentAssignee ? (
            <div className="flex items-center gap-2 w-full">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-xs">
                  {currentAssignee.first_name[0]}{currentAssignee.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">
                {currentAssignee.first_name} {currentAssignee.last_name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Assigner</span>
            </div>
          )}
          <ChevronDown className="h-4 w-4 ml-auto opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un employé..." />
          <CommandList className="max-h-[400px]">
            <CommandEmpty>Aucun employé trouvé.</CommandEmpty>
            
            {/* Suggestions IA */}
            {suggestions.length > 0 && (
              <CommandGroup heading="🤖 Suggestions IA">
                {suggestions.slice(0, 3).map((suggestion) => (
                  <CommandItem
                    key={suggestion.employee.id}
                    value={`${suggestion.employee.first_name} ${suggestion.employee.last_name}`}
                    onSelect={() => handleAssign(suggestion.employee, `Suggestion IA: ${suggestion.reasons[0]}`)}
                    className="flex items-start gap-3 p-3"
                  >
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className="text-xs">
                        {suggestion.employee.first_name[0]}{suggestion.employee.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {suggestion.employee.first_name} {suggestion.employee.last_name}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getConfidenceColor(suggestion.confidence_score)}`}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {Math.round(suggestion.confidence_score * 100)}%
                        </Badge>
                      </div>
                      
                      {suggestion.employee.position && (
                        <p className="text-xs text-muted-foreground">
                          {suggestion.employee.position.title}
                        </p>
                      )}
                      
                      <div className="space-y-1">
                        {suggestion.reasons.slice(0, 2).map((reason, idx) => (
                          <p key={idx} className="text-xs text-muted-foreground leading-relaxed">
                            {reason}
                          </p>
                        ))}
                      </div>
                      
                      <div className="flex gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="text-xs">Perf: {suggestion.employee.performance_score}/5</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-600" />
                          <span className="text-xs">Dispo: {Math.round(suggestion.workload_score * 100)}%</span>
                        </div>
                        {suggestion.skill_match_score > 0 && (
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-purple-600" />
                            <span className="text-xs">Match: {Math.round(suggestion.skill_match_score * 100)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {/* Tous les employés */}
            <CommandGroup heading="👥 Tous les employés">
              {currentAssignee && (
                <CommandItem
                  value="unassign"
                  onSelect={() => handleAssign(null)}
                  className="text-muted-foreground"
                >
                  <User className="h-4 w-4 mr-2" />
                  Supprimer l'assignation
                </CommandItem>
              )}
              
              {employees
                .filter(emp => !suggestions.slice(0, 3).some(s => s.employee.id === emp.id))
                .map((employee) => (
                  <CommandItem
                    key={employee.id}
                    value={`${employee.first_name} ${employee.last_name}`}
                    onSelect={() => handleAssign(employee)}
                    className="flex items-center gap-3"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {employee.first_name[0]}{employee.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span>{employee.first_name} {employee.last_name}</span>
                        {employee.user_id === currentAssigneeId && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      {employee.position && (
                        <p className="text-xs text-muted-foreground">
                          {employee.position.title}
                        </p>
                      )}
                    </div>
                  </CommandItem>
                ))
              }
            </CommandGroup>
          </CommandList>
        </Command>
        
        {suggesting && (
          <div className="border-t p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Brain className="h-4 w-4 animate-pulse" />
              <span>Analyse des suggestions IA...</span>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}