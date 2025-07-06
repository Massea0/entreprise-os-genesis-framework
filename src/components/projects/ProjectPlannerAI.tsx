import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bot, 
  Calendar, 
  Users, 
  Clock, 
  DollarSign, 
  Target, 
  Sparkles,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

interface ProjectPlannerProps {
  onProjectCreated: (project: any) => void;
  companies: any[];
  employees: any[];
}

interface AIGeneratedPlan {
  phases: Array<{
    name: string;
    description: string;
    duration: number;
    tasks: Array<{
      title: string;
      description: string;
      estimatedHours: number;
      requiredSkills: string[];
      assignedEmployee?: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
    }>;
  }>;
  totalDuration: number;
  estimatedBudget: number;
  recommendedTeam: string[];
  riskAssessment: string[];
  timeline: string;
}

export const ProjectPlannerAI: React.FC<ProjectPlannerProps> = ({
  onProjectCreated,
  companies,
  employees
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectData, setProjectData] = useState({
    name: '',
    clientId: '',
    description: '',
    priority: 'medium'
  });
  const [generatedPlan, setGeneratedPlan] = useState<AIGeneratedPlan | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const generateAIPlan = async () => {
    if (!projectData.name || !projectData.clientId) {
      toast({
        variant: "destructive",
        title: "Informations manquantes",
        description: "Veuillez saisir le nom du projet et sélectionner un client"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Récupérer les données de l'équipe pour optimiser l'assignation
      const { data: teamData } = await supabase
        .from('employees')
        .select('*')
        .eq('employment_status', 'active');

      const { data: aiPlan, error } = await supabase.functions.invoke('project-planner-ai', {
        body: {
          projectName: projectData.name,
          clientId: projectData.clientId,
          description: projectData.description || `Projet ${projectData.name} pour le client`,
          priority: projectData.priority,
          availableTeam: teamData || [],
          companyContext: {
            totalEmployees: teamData?.length || 0,
            skills: teamData?.flatMap(emp => emp.skills || []) || []
          }
        }
      });

      if (error) throw error;

      if (aiPlan?.success) {
        setGeneratedPlan(aiPlan.data);
        setCurrentStep(2);
        
        toast({
          title: "🤖 Plan généré avec succès",
          description: "Synapse a analysé votre projet et créé un plan détaillé automatiquement"
        });
      }
    } catch (error) {
      console.error('Erreur génération IA:', error);
      toast({
        variant: "destructive",
        title: "Erreur Synapse",
        description: "Impossible de générer le plan automatiquement"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const createProjectWithPlan = async () => {
    if (!generatedPlan) return;

    try {
      // Créer le projet avec les données dans custom_fields - conversion JSON explicite
      const customFields = JSON.parse(JSON.stringify({
        aiGenerated: true,
        aiPlan: generatedPlan,
        priority: projectData.priority
      }));

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: projectData.name,
          description: projectData.description,
          client_company_id: projectData.clientId,
          status: 'planning',
          budget: generatedPlan.estimatedBudget,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + generatedPlan.totalDuration * 24 * 60 * 60 * 1000).toISOString(),
          custom_fields: customFields
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Créer les tâches automatiquement
      const tasksToCreate = generatedPlan.phases.flatMap((phase, phaseIndex) =>
        phase.tasks.map((task, taskIndex) => ({
          title: task.title,
          description: task.description,
          project_id: project.id,
          estimated_hours: task.estimatedHours,
          priority: task.priority,
          status: 'todo',
          assignee_id: task.assignedEmployee || null,
          custom_fields: JSON.parse(JSON.stringify({
            phase: phase.name,
            phaseIndex,
            taskIndex,
            requiredSkills: task.requiredSkills,
            aiGenerated: true
          })),
          position: phaseIndex * 1000 + taskIndex
        }))
      );

      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(tasksToCreate);

      if (tasksError) throw tasksError;

      toast({
        title: "🎉 Projet créé avec succès !",
        description: `${tasksToCreate.length} tâches générées automatiquement par Synapse`
      });

      onProjectCreated(project);
      
      // Reset
      setProjectData({ name: '', clientId: '', description: '', priority: 'medium' });
      setGeneratedPlan(null);
      setCurrentStep(1);

    } catch (error) {
      console.error('Erreur création projet:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer le projet"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec progression */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">🧠 Synapse - Planificateur IA</h2>
                <p className="text-muted-foreground">
                  Synapse analyse votre équipe et génère automatiquement tout le plan projet
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="mb-2">
                Étape {currentStep}/2
              </Badge>
              <Progress value={currentStep * 50} className="w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Étape 1: Informations projet */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Informations du Projet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectName">Nom du projet *</Label>
                <Input
                  id="projectName"
                  value={projectData.name}
                  onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                  placeholder="Ex: Site web e-commerce"
                />
              </div>

              <div>
                <Label htmlFor="client">Client *</Label>
                <Select
                  value={projectData.clientId}
                  onValueChange={(value) => setProjectData({ ...projectData, clientId: value })}
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

            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                value={projectData.description}
                onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                placeholder="Décrivez brièvement le projet... (Synapse s'occupera du reste)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={projectData.priority}
                onValueChange={(value) => setProjectData({ ...projectData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Magie de Synapse
              </h4>
              <p className="text-blue-800 text-sm">
                Une fois ces informations saisies, Synapse va automatiquement :
              </p>
              <ul className="list-disc list-inside text-blue-700 text-sm mt-2 space-y-1">
                <li>Analyser les compétences de votre équipe</li>
                <li>Générer toutes les tâches et phases du projet</li>
                <li>Assigner les tâches aux bonnes personnes</li>
                <li>Estimer les durées et le budget</li>
                <li>Créer un planning optimisé</li>
              </ul>
            </div>

            <Button 
              onClick={generateAIPlan}
              disabled={isGenerating || !projectData.name || !projectData.clientId}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Synapse en cours de génération...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" />
                  🚀 Générer le plan complet avec Synapse
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Étape 2: Plan généré */}
      {currentStep === 2 && generatedPlan && (
        <div className="space-y-6">
          {/* Résumé du plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Plan Généré par Synapse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <div className="font-semibold">{generatedPlan.totalDuration} jours</div>
                  <div className="text-sm text-muted-foreground">Durée totale</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="font-semibold">{generatedPlan.estimatedBudget.toLocaleString()} XOF</div>
                  <div className="text-sm text-muted-foreground">Budget estimé</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <div className="font-semibold">{generatedPlan.recommendedTeam.length}</div>
                  <div className="text-sm text-muted-foreground">Personnes recommandées</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Target className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                  <div className="font-semibold">{generatedPlan.phases.length}</div>
                  <div className="text-sm text-muted-foreground">Phases</div>
                </div>
              </div>

              {/* Phases détaillées */}
              <div className="space-y-4">
                {generatedPlan.phases.map((phase, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Phase {index + 1}: {phase.name}</h4>
                        <Badge variant="outline">{phase.duration} jours</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{phase.description}</p>
                      
                      <div className="space-y-2">
                        {phase.tasks.map((task, taskIndex) => (
                          <div key={taskIndex} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{task.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {task.estimatedHours}h • {task.requiredSkills.join(', ')}
                              </div>
                            </div>
                            <Badge variant={
                              task.priority === 'urgent' ? 'destructive' :
                              task.priority === 'high' ? 'default' :
                              task.priority === 'medium' ? 'secondary' : 'outline'
                            }>
                              {task.priority}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Risques identifiés */}
              {generatedPlan.riskAssessment.length > 0 && (
                <Card className="mt-6 border-orange-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      Risques identifiés par Synapse
                    </h4>
                    <ul className="space-y-1">
                      {generatedPlan.riskAssessment.map((risk, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-orange-600 font-bold mt-1">•</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3 mt-6">
                <Button onClick={() => setCurrentStep(1)} variant="outline">
                  Retour
                </Button>
                <Button onClick={createProjectWithPlan} className="flex-1" size="lg">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Créer le projet avec ce plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
