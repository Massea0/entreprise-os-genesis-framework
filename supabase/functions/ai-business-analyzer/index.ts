import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BusinessData {
  projects: any[];
  employees: any[];
  tasks: any[];
  companies: any[];
  devis: any[];
  invoices: any[];
  currentModule: string;
}

interface AIInsight {
  id: string;
  type: 'recommendation' | 'alert' | 'prediction' | 'analysis';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'hr' | 'projects' | 'business' | 'performance';
  actionable: boolean;
  data: any;
  confidence: number;
  createdAt: string;
  actions?: {
    type: string;
    module: string;
    action: string;
    data?: any;
  }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!geminiApiKey) {
      throw new Error('Clé API Gemini manquante');
    }

    const { projects, employees, tasks, companies, devis, invoices, currentModule }: BusinessData = await req.json();

    // Analyser les données avec l'IA
    const analysisPrompt = `
Tu es un consultant en intelligence d'affaires. Analyse ces données d'entreprise et génère des insights pertinents avec des actions concrètes:

**DONNÉES ENTREPRISE:**
- Projets: ${projects.length} total (${projects.filter(p => p.status === 'in_progress').length} en cours, ${projects.filter(p => p.status === 'completed').length} terminés)
- Employés: ${employees.length} total
- Tâches: ${tasks.length} total (${tasks.filter(t => t.status === 'done').length} terminées, ${tasks.filter(t => t.status === 'in_progress').length} en cours)
- Clients: ${companies.length} total
- Devis: ${devis.length} total (${devis.filter(d => d.status === 'pending').length} en attente, ${devis.filter(d => d.status === 'approved').length} approuvés)
- Factures: ${invoices.length} total (${invoices.filter(i => i.status === 'paid').length} payées, ${invoices.filter(i => i.status === 'pending').length} en attente)

**CONTEXTE:**
- Module actuel: ${currentModule}
- Analyse au: ${new Date().toISOString()}

**INSTRUCTIONS:**
1. Génère 3-5 insights pertinents basés sur l'analyse croisée des données
2. Propose des actions concrètes et interconnectées entre modules
3. Priorise selon l'impact business réel
4. Inclus des actions spécifiques (ex: "Créer campagne recrutement", "Relancer factures", "Optimiser assignation tâches")

**EXEMPLES D'INSIGHTS INTELLIGENTS:**
- Si manque d'employés vs projets → Suggérer recrutement avec actions concrètes
- Si taux conversion devis faible → Proposer optimisation avec A/B testing  
- Si factures en retard → Actions de relance automatisées
- Si tâches non assignées → Optimisation IA des assignations

Réponds en JSON avec cette structure exacte:
{
  "insights": [
    {
      "id": "1",
      "type": "recommendation|alert|prediction|analysis", 
      "title": "🎯 Titre accrocheur",
      "description": "Description avec données chiffrées et recommandations précises",
      "impact": "high|medium|low",
      "category": "hr|projects|business|performance", 
      "actionable": true,
      "data": { "key": "valeur avec métriques" },
      "confidence": 85,
      "createdAt": "${new Date().toISOString()}",
      "actions": [
        {
          "type": "create_recruitment",
          "module": "hr", 
          "action": "Lancer campagne recrutement 2 développeurs",
          "data": { "positions": ["dev_senior", "dev_junior"], "urgency": "high" }
        }
      ]
    }
  ]
}
`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + geminiApiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: analysisPrompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur API Gemini: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    // Extraire le JSON de la réponse
    let insights: AIInsight[] = [];
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysisResult = JSON.parse(jsonMatch[0]);
        insights = analysisResult.insights || [];
      }
    } catch (parseError) {
      console.error('Erreur parsing JSON:', parseError);
      // Fallback avec analyse basique
      insights = generateFallbackInsights(projects, employees, tasks, companies, devis, invoices);
    }

    return new Response(JSON.stringify({ 
      insights,
      generatedAt: new Date().toISOString(),
      dataSnapshot: {
        projects: projects.length,
        employees: employees.length,
        tasks: tasks.length,
        companies: companies.length,
        devis: devis.length,
        invoices: invoices.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erreur ai-business-analyzer:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      insights: [] // Retourner un tableau vide en cas d'erreur
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateFallbackInsights(projects: any[], employees: any[], tasks: any[], companies: any[], devis: any[], invoices: any[]): AIInsight[] {
  const now = new Date();
  
  return [
    {
      id: '1',
      type: 'alert',
      title: '🚨 Analyse Système Indisponible',
      description: `Analyse de base: ${projects.length} projets, ${employees.length} employés, ${companies.length} clients. Système IA temporairement indisponible.`,
      impact: 'medium',
      category: 'performance',
      actionable: false,
      data: { 
        projects: projects.length,
        employees: employees.length,
        companies: companies.length
      },
      confidence: 60,
      createdAt: now.toISOString(),
      actions: []
    }
  ];
}