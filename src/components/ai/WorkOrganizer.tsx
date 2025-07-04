import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { workOrganizationApi, WorkloadAnalysis, TaskAssignmentResult } from '@/services/workOrganizationApi';
import { Brain, Users, Target, AlertTriangle, Clock, TrendingUp, Zap } from 'lucide-react';

interface WorkOrganizerProps {
  projectId?: string;
}

export function WorkOrganizer({ projectId }: WorkOrganizerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<WorkloadAnalysis | null>(null);
  const [assignments, setAssignments] = useState<TaskAssignmentResult | null>(null);
  const [selectedAction, setSelectedAction] = useState<string>('analyze_workload');
  const { toast } = useToast();

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      let result;
      
      switch (selectedAction) {
        case 'analyze_workload':
          result = await workOrganizationApi.analyzeWorkload({ 
            project_id: projectId,
            criteria: {
              prioritize_skills: true,
              balance_workload: true,
              consider_availability: true
            }
          });
          setAnalysis(result);
          break;
          
        case 'assign_tasks':
          const assignmentResult = await workOrganizationApi.assignTasks({
            project_id: projectId,
            criteria: {
              prioritize_skills: true,
              balance_workload: true
            }
          });
          setAssignments(assignmentResult);
          toast({
            title: "Tâches assignées",
            description: `${assignmentResult.success_count} tâches sur ${assignmentResult.total_count} ont été assignées avec succès.`
          });
          break;
          
        case 'optimize_resources':
          result = await workOrganizationApi.optimizeResources({
            project_id: projectId,
            criteria: {
              optimize_cost: true,
              balance_workload: true
            }
          });
          setAnalysis(result);
          break;
          
        case 'predict_bottlenecks':
          result = await workOrganizationApi.predictBottlenecks({
            project_id: projectId,
            time_period: {
              start: new Date().toISOString(),
              end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
            }
          });
          setAnalysis(result);
          break;
      }
      
    } catch (error) {
      console.error('Work organization error:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'analyser l'organisation du travail"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getWorkloadColor = (hours: number) => {
    if (hours > 40) return 'text-red-600';
    if (hours > 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>IA - Organisation du Travail</CardTitle>
          </div>
          <CardDescription>
            Analysez et optimisez l'allocation des employés aux projets avec l'intelligence artificielle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="analyze_workload">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Analyser la charge de travail
                  </div>
                </SelectItem>
                <SelectItem value="assign_tasks">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Assigner les tâches automatiquement
                  </div>
                </SelectItem>
                <SelectItem value="optimize_resources">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Optimiser les ressources
                  </div>
                </SelectItem>
                <SelectItem value="predict_bottlenecks">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Prédire les goulots d'étranglement
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleAnalyze} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Lancer l'analyse IA
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {(analysis || assignments) && (
        <Tabs defaultValue={analysis ? "analysis" : "assignments"} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analysis" disabled={!analysis}>
              <Users className="h-4 w-4 mr-2" />
              Analyse
            </TabsTrigger>
            <TabsTrigger value="assignments" disabled={!assignments}>
              <Target className="h-4 w-4 mr-2" />
              Assignations
            </TabsTrigger>
          </TabsList>

          {/* Workload Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            {analysis && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Employés</p>
                          <p className="text-2xl font-bold">{analysis.summary.total_employees}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Projets Actifs</p>
                          <p className="text-2xl font-bold">{analysis.summary.active_projects}</p>
                        </div>
                        <Target className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Tâches en Attente</p>
                          <p className="text-2xl font-bold">{analysis.summary.pending_tasks}</p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Charge Moyenne</p>
                          <p className="text-2xl font-bold">{Math.round(analysis.summary.avg_workload)}h</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recommendations */}
                {analysis.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Recommandations IA
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysis.recommendations.map((rec, index) => (
                        <Alert key={index}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="flex items-center justify-between">
                            <span>{rec.message}</span>
                            <Badge variant={getPriorityColor(rec.priority)}>
                              {rec.priority}
                            </Badge>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Employee Workloads */}
                <Card>
                  <CardHeader>
                    <CardTitle>Charge de Travail par Employé</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysis.employee_workloads.map((employee) => (
                        <div key={employee.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium">
                                {employee.first_name} {employee.last_name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {employee.skills?.join(', ') || 'Compétences non définies'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`font-medium ${getWorkloadColor(employee.workload.total_hours)}`}>
                                {employee.workload.total_hours}h
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {employee.workload.active_tasks} tâches
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Charge de travail</span>
                              <span>{Math.min(100, (employee.workload.total_hours / 40) * 100).toFixed(0)}%</span>
                            </div>
                            <Progress 
                              value={Math.min(100, (employee.workload.total_hours / 40) * 100)} 
                              className="h-2"
                            />
                            
                            <div className="flex justify-between items-center text-sm">
                              <span>Taux de réalisation: {(employee.workload.completion_rate * 100).toFixed(0)}%</span>
                              <span>Performance: {employee.performance_score || 'N/A'}/10</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Analyse IA Détaillée
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">{analysis.ai_analysis}</pre>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Task Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            {assignments && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Résultats des Assignations IA
                  </CardTitle>
                  <CardDescription>
                    {assignments.success_count} tâches assignées sur {assignments.total_count} tentatives
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assignments.assignments.map((assignment, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">Tâche ID: {assignment.task_id}</h4>
                            <p className="text-sm text-muted-foreground">
                              Assigné à: {assignment.employee_id}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={assignment.status === 'assigned' ? 'default' : 'destructive'}>
                              {assignment.status}
                            </Badge>
                            <Badge variant="outline">
                              {(assignment.confidence * 100).toFixed(0)}% confiance
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Raisonnement:</strong> {assignment.reasoning}
                        </p>
                        {assignment.error && (
                          <Alert variant="destructive">
                            <AlertDescription>{assignment.error}</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}