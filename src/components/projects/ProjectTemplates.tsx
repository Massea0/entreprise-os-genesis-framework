import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Plus, 
  Sparkles, 
  Building2, 
  Code, 
  Palette, 
  Zap,
  Users,
  Target,
  Calendar,
  DollarSign
} from 'lucide-react';

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tasks: TemplateTask[];
  estimated_duration_days: number;
  estimated_budget?: number;
  required_skills: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  ai_generated: boolean;
}

interface TemplateTask {
  title: string;
  description: string;
  estimated_hours: number;
  dependencies: string[];
  priority: 'low' | 'medium' | 'high';
  phase: string;
}

const TEMPLATE_CATEGORIES = [
  { value: 'web_development', label: 'Développement Web', icon: Code },
  { value: 'mobile_app', label: 'Application Mobile', icon: Zap },
  { value: 'marketing', label: 'Marketing Digital', icon: Target },
  { value: 'design', label: 'Design & UX', icon: Palette },
  { value: 'consulting', label: 'Conseil & Formation', icon: Users },
  { value: 'construction', label: 'Construction', icon: Building2 },
  { value: 'custom', label: 'Personnalisé', icon: FileText }
];

const DEFAULT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'web-ecommerce',
    name: 'Site E-commerce Complet',
    description: 'Développement d\'une plateforme e-commerce avec gestion des produits, commandes et paiements',
    category: 'web_development',
    estimated_duration_days: 90,
    estimated_budget: 15000000,
    required_skills: ['React', 'Node.js', 'Base de données', 'Design UX/UI'],
    difficulty_level: 'advanced',
    ai_generated: false,
    tasks: [
      {
        title: 'Analyse des besoins et wireframes',
        description: 'Définition des fonctionnalités et création des maquettes',
        estimated_hours: 40,
        dependencies: [],
        priority: 'high',
        phase: 'Conception'
      },
      {
        title: 'Design et prototype',
        description: 'Création du design visuel et du prototype interactif',
        estimated_hours: 60,
        dependencies: ['Analyse des besoins et wireframes'],
        priority: 'high',
        phase: 'Design'
      },
      {
        title: 'Développement Backend API',
        description: 'API REST pour gestion produits, utilisateurs et commandes',
        estimated_hours: 120,
        dependencies: ['Design et prototype'],
        priority: 'high',
        phase: 'Développement'
      },
      {
        title: 'Développement Frontend',
        description: 'Interface utilisateur responsive',
        estimated_hours: 100,
        dependencies: ['Développement Backend API'],
        priority: 'high',
        phase: 'Développement'
      },
      {
        title: 'Intégration paiements',
        description: 'Intégration des solutions de paiement',
        estimated_hours: 40,
        dependencies: ['Développement Frontend'],
        priority: 'medium',
        phase: 'Intégration'
      },
      {
        title: 'Tests et déploiement',
        description: 'Tests complets et mise en production',
        estimated_hours: 30,
        dependencies: ['Intégration paiements'],
        priority: 'high',
        phase: 'Livraison'
      }
    ]
  },
  {
    id: 'mobile-app',
    name: 'Application Mobile Native',
    description: 'Développement d\'une application mobile cross-platform avec React Native',
    category: 'mobile_app',
    estimated_duration_days: 60,
    estimated_budget: 8000000,
    required_skills: ['React Native', 'JavaScript', 'Design Mobile', 'API Integration'],
    difficulty_level: 'intermediate',
    ai_generated: false,
    tasks: [
      {
        title: 'Conception UX/UI Mobile',
        description: 'Design spécifique aux interfaces mobiles',
        estimated_hours: 50,
        dependencies: [],
        priority: 'high',
        phase: 'Design'
      },
      {
        title: 'Setup projet React Native',
        description: 'Configuration environnement de développement',
        estimated_hours: 20,
        dependencies: ['Conception UX/UI Mobile'],
        priority: 'high',
        phase: 'Développement'
      },
      {
        title: 'Développement écrans principaux',
        description: 'Création des écrans et navigation',
        estimated_hours: 80,
        dependencies: ['Setup projet React Native'],
        priority: 'high',
        phase: 'Développement'
      },
      {
        title: 'Intégration API et données',
        description: 'Connexion aux services backend',
        estimated_hours: 40,
        dependencies: ['Développement écrans principaux'],
        priority: 'medium',
        phase: 'Intégration'
      },
      {
        title: 'Tests et publication',
        description: 'Tests sur appareils et publication stores',
        estimated_hours: 30,
        dependencies: ['Intégration API et données'],
        priority: 'high',
        phase: 'Livraison'
      }
    ]
  },
  {
    id: 'branding-campaign',
    name: 'Campagne de Branding Complète',
    description: 'Stratégie de marque et campagne marketing digitale',
    category: 'marketing',
    estimated_duration_days: 45,
    estimated_budget: 5000000,
    required_skills: ['Stratégie Marketing', 'Design Graphique', 'Rédaction', 'Réseaux Sociaux'],
    difficulty_level: 'intermediate',
    ai_generated: false,
    tasks: [
      {
        title: 'Audit de marque',
        description: 'Analyse de la marque actuelle et positionnement',
        estimated_hours: 30,
        dependencies: [],
        priority: 'high',
        phase: 'Stratégie'
      },
      {
        title: 'Stratégie de communication',
        description: 'Définition des messages et audiences cibles',
        estimated_hours: 40,
        dependencies: ['Audit de marque'],
        priority: 'high',
        phase: 'Stratégie'
      },
      {
        title: 'Création identité visuelle',
        description: 'Logo, charte graphique et supports visuels',
        estimated_hours: 60,
        dependencies: ['Stratégie de communication'],
        priority: 'high',
        phase: 'Création'
      },
      {
        title: 'Campagne réseaux sociaux',
        description: 'Contenus et calendrier éditorial',
        estimated_hours: 50,
        dependencies: ['Création identité visuelle'],
        priority: 'medium',
        phase: 'Exécution'
      },
      {
        title: 'Mesure et optimisation',
        description: 'Suivi KPIs et ajustements',
        estimated_hours: 20,
        dependencies: ['Campagne réseaux sociaux'],
        priority: 'medium',
        phase: 'Suivi'
      }
    ]
  }
];

export const ProjectTemplates = ({ 
  onSelectTemplate 
}: { 
  onSelectTemplate: (template: ProjectTemplate) => void 
}) => {
  const [templates, setTemplates] = useState<ProjectTemplate[]>(DEFAULT_TEMPLATES);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  const filteredTemplates = templates.filter(template => 
    selectedCategory === 'all' || template.category === selectedCategory
  );

  const getCategoryIcon = (category: string) => {
    const categoryData = TEMPLATE_CATEGORIES.find(c => c.value === category);
    const IconComponent = categoryData?.icon || FileText;
    return <IconComponent className="h-4 w-4" />;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleGenerateAITemplate = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('project-planner-ai', {
        body: {
          projectName: 'Template IA Personnalisé',
          description: 'Génération automatique d\'un template de projet',
          requirements: 'Template flexible et adaptable',
          budget: 1000000,
          timeline: 30
        }
      });

      if (error) throw error;

      if (data?.success && data?.projectPlan) {
        const aiTemplate: ProjectTemplate = {
          id: `ai-${Date.now()}`,
          name: data.projectPlan.name || 'Template IA',
          description: data.projectPlan.description || 'Template généré par IA',
          category: 'custom',
          estimated_duration_days: data.projectPlan.estimated_duration || 30,
          estimated_budget: data.projectPlan.estimated_budget,
          required_skills: data.projectPlan.required_skills || [],
          difficulty_level: 'intermediate',
          ai_generated: true,
          tasks: (data.projectPlan.phases || []).flatMap((phase: any) => 
            (phase.tasks || []).map((task: any) => ({
              title: task.name || task.title,
              description: task.description,
              estimated_hours: task.estimated_hours || 8,
              dependencies: [],
              priority: task.priority || 'medium',
              phase: phase.name || 'Développement'
            }))
          )
        };

        setTemplates(prev => [aiTemplate, ...prev]);
        
        toast({
          title: "Template IA créé",
          description: "Un nouveau template a été généré par l'IA"
        });
      }

    } catch (error) {
      console.error('Error generating AI template:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la génération du template IA"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Templates de Projets</h2>
          <p className="text-muted-foreground">
            Démarrez rapidement avec des modèles prêts à l'emploi
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateAITemplate}
            disabled={loading}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {loading ? 'Génération...' : 'Générer avec IA'}
          </Button>
          
          <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Créer Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Label>Catégorie:</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {TEMPLATE_CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                <div className="flex items-center gap-2">
                  <category.icon className="h-4 w-4" />
                  {category.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(template.category)}
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.ai_generated && (
                      <Badge variant="secondary" className="gap-1">
                        <Sparkles className="h-3 w-3" />
                        IA
                      </Badge>
                    )}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={getDifficultyColor(template.difficulty_level)}
                  >
                    {template.difficulty_level === 'beginner' && 'Débutant'}
                    {template.difficulty_level === 'intermediate' && 'Intermédiaire'}
                    {template.difficulty_level === 'advanced' && 'Avancé'}
                  </Badge>
                </div>
              </div>
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{template.estimated_duration_days} jours</span>
                </div>
                
                {template.estimated_budget && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{(template.estimated_budget / 1000000).toFixed(1)}M XOF</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>{template.tasks.length} tâches</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{template.required_skills.length} compétences</span>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Compétences requises:</div>
                <div className="flex flex-wrap gap-1">
                  {template.required_skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {template.required_skills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.required_skills.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action */}
              <Button 
                onClick={() => onSelectTemplate(template)}
                className="w-full"
              >
                Utiliser ce template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun template trouvé</h3>
            <p className="text-muted-foreground mb-4">
              Aucun template ne correspond à cette catégorie
            </p>
            <Button variant="outline" onClick={() => setSelectedCategory('all')}>
              Voir tous les templates
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};