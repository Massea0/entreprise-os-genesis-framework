import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MermaidDiagram from './MermaidDiagram';
import { 
  Workflow, 
  Calendar, 
  Share2, 
  Brain, 
  Clock,
  Loader2,
  Download,
  RefreshCw
} from 'lucide-react';

interface MermaidTaskViewerProps {
  taskId: string;
  taskTitle?: string;
}

export default function MermaidTaskViewer({ taskId, taskTitle }: MermaidTaskViewerProps) {
  const [mermaidCode, setMermaidCode] = useState<string>('');
  const [diagramType, setDiagramType] = useState<string>('gantt');
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const { toast } = useToast();

  const diagramTypes = [
    { value: 'gantt', label: 'Diagramme de Gantt', icon: Calendar, description: 'Planification temporelle avec sous-tâches' },
    { value: 'flowchart', label: 'Processus', icon: Workflow, description: 'Étapes et décisions du processus' },
    { value: 'mindmap', label: 'Mind Map', icon: Brain, description: 'Organisation des idées et concepts' },
    { value: 'timeline', label: 'Chronologie', icon: Clock, description: 'Vue temporelle dans le contexte projet' },
  ];

  const generateDiagram = async (type: string = diagramType) => {
    if (!taskId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('task-mermaid-generator', {
        body: { 
          taskId, 
          diagramType: type 
        }
      });

      if (error) throw error;

      setMermaidCode(data.mermaidCode);
      setHasGenerated(true);
      
      toast({
        title: "Diagramme généré",
        description: `${diagramTypes.find(t => t.value === type)?.label} créé avec succès`
      });

    } catch (error) {
      console.error('Erreur génération diagramme:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de générer le diagramme"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = async (newType: string) => {
    setDiagramType(newType);
    if (hasGenerated) {
      await generateDiagram(newType);
    }
  };

  const downloadDiagram = () => {
    const element = document.createElement('a');
    const file = new Blob([mermaidCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `task-${taskId}-${diagramType}.mmd`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      toast({
        title: "Copié",
        description: "Code Mermaid copié dans le presse-papiers"
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de copier le code"
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Visualisation IA - {taskTitle}
          </CardTitle>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Workflow className="h-3 w-3" />
            Powered by Gemini
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Sélecteur de type de diagramme */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Type de diagramme</label>
            <Select value={diagramType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {diagramTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => generateDiagram()} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : hasGenerated ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
              {loading ? 'Génération...' : hasGenerated ? 'Régénérer' : 'Générer'}
            </Button>
            
            {hasGenerated && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={downloadDiagram}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Affichage du diagramme */}
        {mermaidCode && (
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden bg-white">
              <MermaidDiagram chart={mermaidCode} />
            </div>
            
            {/* Aperçu du code */}
            <details className="border rounded-lg">
              <summary className="p-3 cursor-pointer hover:bg-muted/50 font-medium">
                Code Mermaid généré
              </summary>
              <div className="p-3 border-t bg-muted/20">
                <pre className="text-sm overflow-x-auto">
                  <code>{mermaidCode}</code>
                </pre>
              </div>
            </details>
          </div>
        )}

        {/* Message d'aide initial */}
        {!hasGenerated && !loading && (
          <div className="text-center py-8 space-y-3 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto opacity-50" />
            <div>
              <p className="font-medium">Visualisation intelligente de vos tâches</p>
              <p className="text-sm">L'IA analysera votre tâche et générera automatiquement :</p>
              <ul className="text-sm mt-2 space-y-1">
                <li>• Décomposition en sous-tâches</li>
                <li>• Estimations de temps réalistes</li>
                <li>• Dépendances et séquencement</li>
                <li>• Visualisation adaptée au contexte</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}