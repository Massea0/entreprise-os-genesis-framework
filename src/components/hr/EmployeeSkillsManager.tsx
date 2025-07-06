
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Plus, X, Star } from 'lucide-react';

interface Skill {
  name: string;
  level: number; // 1-10
  category: string;
  verified: boolean;
}

interface SkillsManagerProps {
  skills: Skill[];
  onSkillsChange: (skills: Skill[]) => void;
  isEditable?: boolean;
}

const SKILL_CATEGORIES = [
  'Technique',
  'Management',
  'Communication',
  'Design',
  'Marketing',
  'Vente',
  'Finance',
  'Langues'
];

export const EmployeeSkillsManager: React.FC<SkillsManagerProps> = ({
  skills,
  onSkillsChange,
  isEditable = true
}) => {
  const [newSkill, setNewSkill] = useState({ name: '', level: 5, category: 'Technique' });
  const [showAddForm, setShowAddForm] = useState(false);

  const addSkill = () => {
    if (newSkill.name.trim()) {
      const skill: Skill = {
        ...newSkill,
        verified: false
      };
      onSkillsChange([...skills, skill]);
      setNewSkill({ name: '', level: 5, category: 'Technique' });
      setShowAddForm(false);
    }
  };

  const removeSkill = (index: number) => {
    onSkillsChange(skills.filter((_, i) => i !== index));
  };

  const updateSkillLevel = (index: number, level: number) => {
    const updatedSkills = [...skills];
    updatedSkills[index].level = level;
    onSkillsChange(updatedSkills);
  };

  const getSkillColor = (level: number) => {
    if (level >= 8) return 'bg-green-500';
    if (level >= 6) return 'bg-blue-500';
    if (level >= 4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const skillsByCategory = skills.reduce((acc, skill, index) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push({ ...skill, index });
    return acc;
  }, {} as Record<string, (Skill & { index: number })[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Compétences Professionnelles
          </CardTitle>
          {isEditable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulaire d'ajout */}
        {showAddForm && isEditable && (
          <Card className="border-primary/20">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="skillName">Compétence</Label>
                  <Input
                    id="skillName"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                    placeholder="Ex: React, Leadership..."
                  />
                </div>
                <div>
                  <Label htmlFor="skillCategory">Catégorie</Label>
                  <select
                    id="skillCategory"
                    value={newSkill.category}
                    onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    {SKILL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="skillLevel">Niveau (1-10)</Label>
                  <Input
                    id="skillLevel"
                    type="number"
                    min={1}
                    max={10}
                    value={newSkill.level}
                    onChange={(e) => setNewSkill({ ...newSkill, level: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={addSkill} size="sm">Ajouter</Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)} size="sm">
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Affichage des compétences par catégorie */}
        {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
          <div key={category} className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {category}
            </h4>
            <div className="space-y-2">
              {categorySkills.map((skill) => (
                <div key={skill.index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{skill.name}</span>
                      {skill.verified && (
                        <Badge variant="secondary" className="text-xs">
                          Vérifié
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={skill.level * 10} 
                        className="flex-1 h-2"
                      />
                      <span className="text-sm font-medium w-8">{skill.level}/10</span>
                    </div>
                  </div>
                  {isEditable && (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={skill.level}
                        onChange={(e) => updateSkillLevel(skill.index, parseInt(e.target.value))}
                        className="w-16 h-8"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSkill(skill.index)}
                        className="h-8 w-8 p-0 text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {skills.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune compétence enregistrée</p>
            {isEditable && (
              <p className="text-sm">Ajoutez les compétences de cet employé</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
