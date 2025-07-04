import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Zap, Users, Clock, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TaskSuggestion {
  title: string;
  description: string;
  estimatedHours: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requiredSkills?: string[];
  phase?: string;
}

interface BulkCreateResult {
  created: Array<{
    id: string;
    title: string;
    assignee_id?: string;
    suggestedEmployee?: {
      id: string;
      name: string;
      position?: string;
    };
  }>;
  errors: string[];
  summary: {
    total: number;
    created: number;
    failed: number;
    autoAssigned: number;
  };
}

interface TaskBulkCreatorProps {
  projectId: string;
  onTasksCreated?: (tasks: any[]) => void;
  trigger?: React.ReactNode;
}

export function TaskBulkCreator({ projectId, onTasksCreated, trigger }: TaskBulkCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [taskDescriptions, setTaskDescriptions] = useState('');
  const [autoAssign, setAutoAssign] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [result, setResult] = useState<BulkCreateResult | null>(null);
  const { toast } = useToast();

  const generateTaskSuggestions = async () => {
    if (!taskDescriptions.trim()) {
      toast({
        variant: "destructive",
        title: "Description manquante",
        description: "Veuillez décrire les tâches que vous souhaitez créer"
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      // Simulation de génération de tâches basée sur la description
      // Dans un vrai cas, ceci pourrait utiliser une IA pour parser la description
      const lines = taskDescriptions.split('\n').filter(line => line.trim());
      const generatedTasks: TaskSuggestion[] = lines.map((line, index) => {
        const title = line.trim();
        return {
          title,
          description: `Tâche générée automatiquement: ${title}`,
          estimatedHours: Math.floor(Math.random() * 16) + 1, // 1-16 heures
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
          requiredSkills: ['Développement', 'Design', 'Analyse'][Math.floor(Math.random() * 3)] ? 
            [['Développement', 'Design', 'Analyse'][Math.floor(Math.random() * 3)]] : undefined
        };
      });

      setSuggestions(generatedTasks);
      toast({
        title: "Suggestions générées",
        description: `${generatedTasks.length} tâches ont été analysées et préparées`
      });
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        variant: "destructive",
        title: "Erreur de génération",
        description: "Impossible de générer les suggestions de tâches"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const createTasks = async () => {
    if (suggestions.length === 0) {
      toast({
        variant: "destructive",
        title: "Aucune tâche",
        description: "Générez d'abord des suggestions de tâches"
      });
      return;
    }

    try {
      setIsCreating(true);

      const { data, error } = await supabase.functions.invoke('bulk-create-tasks', {
        body: {
          projectId,
          tasks: suggestions,
          autoAssign
        }
      });

      if (error) throw error;

      if (data.success) {
        setResult(data.data);
        onTasksCreated?.(data.data.created);
        
        toast({
          title: "Tâches créées avec succès",
          description: `${data.data.summary.created}/${data.data.summary.total} tâches ont été créées`
        });
      } else {
        throw new Error(data.error || 'Erreur lors de la création des tâches');
      }
    } catch (error) {
      console.error('Error creating tasks:', error);
      toast({
        variant: "destructive",
        title: "Erreur de création",
        description: "Impossible de créer les tâches en lot"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setTaskDescriptions('');
    setSuggestions([]);
    setResult(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Création en lot
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Création de tâches en lot
          </DialogTitle>
          <DialogDescription>
            Décrivez plusieurs tâches et laissez l'IA les organiser et les assigner automatiquement
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {!result ? (
              <>
                {/* Étape 1: Description des tâches */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tasks-description">
                      Description des tâches (une par ligne)
                    </Label>
                    <Textarea
                      id="tasks-description"
                      placeholder="Ex:
Créer la maquette de la page d'accueil
Développer l'API d'authentification
Rédiger la documentation utilisateur
Tester les fonctionnalités principales
Configurer l'environnement de production"
                      value={taskDescriptions}
                      onChange={(e) => setTaskDescriptions(e.target.value)}
                      rows={8}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-assign"
                      checked={autoAssign}
                      onCheckedChange={setAutoAssign}
                    />
                    <Label htmlFor="auto-assign" className="text-sm">
                      Assignation automatique basée sur les compétences
                    </Label>
                  </div>

                  <Button 
                    onClick={generateTaskSuggestions}
                    disabled={isGenerating || !taskDescriptions.trim()}
                    className="w-full"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Analyse en cours...' : 'Analyser et préparer les tâches'}
                  </Button>
                </div>

                {/* Étape 2: Aperçu des suggestions */}
                {suggestions.length > 0 && (
                  <div className="space-y-4">
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Tâches préparées ({suggestions.length})
                      </h3>
                      
                      <div className="space-y-3">
                        {suggestions.map((task, index) => (
                          <Card key={index} className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm mb-1">{task.title}</h4>
                                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                  {task.description}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {task.estimatedHours}h
                                  </Badge>
                                  <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </Badge>
                                  {task.requiredSkills && task.requiredSkills.length > 0 && (
                                    <div className="flex gap-1">
                                      {task.requiredSkills.map((skill, skillIndex) => (
                                        <Badge key={skillIndex} variant="secondary" className="text-xs">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={createTasks}
                      disabled={isCreating}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {isCreating ? 'Création en cours...' : `Créer ${suggestions.length} tâches`}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              /* Étape 3: Résultats */
              <div className="space-y-4">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Tâches créées avec succès !</h3>
                  <p className="text-muted-foreground">
                    {result.summary.created} tâches sur {result.summary.total} ont été créées
                    {result.summary.autoAssigned > 0 && ` (${result.summary.autoAssigned} auto-assignées)`}
                  </p>
                </div>

                {/* Résumé */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Résumé de l'opération</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {result.summary.created}
                        </div>
                        <div className="text-sm text-muted-foreground">Créées</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {result.summary.autoAssigned}
                        </div>
                        <div className="text-sm text-muted-foreground">Assignées</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {result.summary.failed}
                        </div>
                        <div className="text-sm text-muted-foreground">Échouées</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {result.summary.total}
                        </div>
                        <div className="text-sm text-muted-foreground">Total</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tâches créées */}
                {result.created.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Tâches créées</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.created.map((task, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-sm">{task.title}</span>
                            </div>
                            {task.suggestedEmployee && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {task.suggestedEmployee.name}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Erreurs */}
                {result.errors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        Erreurs rencontrées
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {result.errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-600">
                            • {error}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            {result ? 'Fermer' : 'Annuler'}
          </Button>
          {result && (
            <Button onClick={() => {
              resetForm();
              // Fermer et actualiser la vue des tâches
              handleClose();
            }}>
              Créer d'autres tâches
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}