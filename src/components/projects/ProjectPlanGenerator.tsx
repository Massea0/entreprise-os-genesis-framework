import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Clock, DollarSign, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProjectPlan {
  phases: Array<{
    name: string;
    description: string;
    estimatedDuration: number;
    tasks: Array<{
      title: string;
      description: string;
      estimatedHours: number;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      requiredSkills?: string[];
    }>;
  }>;
  totalEstimatedDuration: number;
  estimatedBudget?: number;
  recommendations: string[];
  arcadisLevel: 'START' | 'PRO' | 'EXPERT';
}

interface ProjectPlanGeneratorProps {
  projectName: string;
  projectDescription: string;
  projectBudget?: number;
  clientType?: string;
  industry?: string;
  onPlanGenerated?: (plan: ProjectPlan) => void;
  onTasksCreated?: (tasks: any[]) => void;
}

export function ProjectPlanGenerator({
  projectName,
  projectDescription,
  projectBudget,
  clientType,
  industry,
  onPlanGenerated,
  onTasksCreated
}: ProjectPlanGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<ProjectPlan | null>(null);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const { toast } = useToast();

  const generatePlan = async () => {
    if (!projectName || !projectDescription) {
      toast({
        variant: "destructive",
        title: "Informations manquantes",
        description: "Veuillez saisir au minimum le nom et la description du projet"
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      const { data, error } = await supabase.functions.invoke('project-planner-ai', {
        body: {
          name: projectName,
          description: projectDescription,
          budget: projectBudget,
          clientType: clientType || 'Standard',
          industry: industry || 'Général'
        }
      });

      if (error) throw error;

      if (data.success) {
        setGeneratedPlan(data.data);
        setShowPlanDialog(true);
        onPlanGenerated?.(data.data);
        
        toast({
          title: "Plan généré avec succès",
          description: "L'IA a analysé votre projet et proposé un plan détaillé"
        });
      } else {
        throw new Error(data.error || 'Erreur lors de la génération du plan');
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      toast({
        variant: "destructive",
        title: "Erreur de génération",
        description: "Impossible de générer le plan avec l'IA. Veuillez réessayer."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const createTasksFromPlan = async (projectId: string) => {
    if (!generatedPlan) return;

    try {
      setIsCreatingTasks(true);

      // Préparer les tâches à partir du plan généré
      const tasksToCreate = generatedPlan.phases.flatMap(phase => 
        phase.tasks.map(task => ({
          title: task.title,
          description: task.description,
          estimatedHours: task.estimatedHours,
          priority: task.priority,
          requiredSkills: task.requiredSkills,
          phase: phase.name
        }))
      );

      const { data, error } = await supabase.functions.invoke('bulk-create-tasks', {
        body: {
          projectId,
          tasks: tasksToCreate,
          autoAssign: true
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Tâches créées avec succès",
          description: `${data.data.summary.created}/${data.data.summary.total} tâches ont été créées`
        });
        onTasksCreated?.(data.data.created);
        setShowPlanDialog(false);
      } else {
        throw new Error(data.error || 'Erreur lors de la création des tâches');
      }
    } catch (error) {
      console.error('Error creating tasks:', error);
      toast({
        variant: "destructive",
        title: "Erreur de création",
        description: "Impossible de créer les tâches. Veuillez réessayer."
      });
    } finally {
      setIsCreatingTasks(false);
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'START': return 'bg-green-100 text-green-800';
      case 'PRO': return 'bg-blue-100 text-blue-800';
      case 'EXPERT': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Button 
        onClick={generatePlan}
        disabled={isGenerating || !projectName || !projectDescription}
        className="w-full"
        variant="outline"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        {isGenerating ? 'Génération en cours...' : 'Générer un plan avec l\'IA'}
      </Button>

      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Plan de projet généré par l'IA
            </DialogTitle>
            <DialogDescription>
              Analyse intelligente et recommandations pour votre projet
            </DialogDescription>
          </DialogHeader>

          {generatedPlan && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Informations générales */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Analyse du projet</CardTitle>
                      <Badge className={getLevelBadgeColor(generatedPlan.arcadisLevel)}>
                        Niveau {generatedPlan.arcadisLevel}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Durée estimée</p>
                          <p className="font-medium">{generatedPlan.totalEstimatedDuration} jours</p>
                        </div>
                      </div>
                      
                      {generatedPlan.estimatedBudget && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Budget estimé</p>
                            <p className="font-medium">
                              {generatedPlan.estimatedBudget.toLocaleString('fr-FR')} XOF
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Phases</p>
                          <p className="font-medium">{generatedPlan.phases.length} phases</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Phases du projet */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Phases du projet</h3>
                  {generatedPlan.phases.map((phase, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">
                            {index + 1}
                          </span>
                          {phase.name}
                        </CardTitle>
                        <CardDescription>{phase.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Durée: {phase.estimatedDuration} jours</span>
                            <span>Tâches: {phase.tasks.length}</span>
                          </div>
                          
                          <div className="space-y-2">
                            {phase.tasks.map((task, taskIndex) => (
                              <div key={taskIndex} className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                                <CheckCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">{task.title}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {task.estimatedHours}h
                                    </Badge>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${
                                        task.priority === 'urgent' ? 'border-red-200 text-red-700' :
                                        task.priority === 'high' ? 'border-orange-200 text-orange-700' :
                                        task.priority === 'medium' ? 'border-yellow-200 text-yellow-700' :
                                        'border-blue-200 text-blue-700'
                                      }`}
                                    >
                                      {task.priority}
                                    </Badge>
                                    {task.requiredSkills && task.requiredSkills.length > 0 && (
                                      <div className="flex gap-1">
                                        {task.requiredSkills.slice(0, 2).map((skill, skillIndex) => (
                                          <Badge key={skillIndex} variant="secondary" className="text-xs">
                                            {skill}
                                          </Badge>
                                        ))}
                                        {task.requiredSkills.length > 2 && (
                                          <Badge variant="secondary" className="text-xs">
                                            +{task.requiredSkills.length - 2}
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Recommandations */}
                {generatedPlan.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        Recommandations Arcadis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {generatedPlan.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-primary font-bold mt-1">•</span>
                            <span>{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                <Separator />

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
                    Fermer
                  </Button>
                  <Button 
                    onClick={() => {
                      // Cette fonction sera appelée avec l'ID du projet une fois créé
                      toast({
                        title: "Plan accepté",
                        description: "Créez d'abord le projet, puis les tâches seront générées automatiquement"
                      });
                    }}
                    disabled={isCreatingTasks}
                  >
                    {isCreatingTasks ? 'Création en cours...' : 'Accepter le plan'}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}