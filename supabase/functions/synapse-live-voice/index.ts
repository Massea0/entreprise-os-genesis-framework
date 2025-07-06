import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Interface pour les données contextuelles
interface ContextualData {
  projects: any[];
  employees: any[];
  tasks: any[];
  devis: any[];
  invoices: any[];
  userRole: string;
  userId: string;
}

// Fonction pour analyser le contexte et générer une réponse intelligente
function generateContextualResponse(message: string, context: ContextualData): string {
  const lowerMessage = message.toLowerCase();
  
  // Analyse des projets
  if (lowerMessage.includes('projet') || lowerMessage.includes('project')) {
    const activeProjects = context.projects.filter(p => p.status === 'in_progress');
    const delayedProjects = context.projects.filter(p => 
      p.status === 'in_progress' && new Date(p.end_date) < new Date()
    );
    
    if (lowerMessage.includes('retard')) {
      return `Actuellement, ${delayedProjects.length} projets sont en retard sur ${context.projects.length} projets totaux. ${delayedProjects.length > 0 ? 'Voulez-vous que je vous donne plus de détails ?' : 'Tous vos projets sont dans les temps !'}`;
    }
    
    return `Vous avez ${context.projects.length} projets au total, dont ${activeProjects.length} en cours. ${delayedProjects.length > 0 ? `Attention: ${delayedProjects.length} projets en retard.` : 'Tous dans les temps !'}`;
  }
  
  // Analyse des tâches
  if (lowerMessage.includes('tâche') || lowerMessage.includes('task')) {
    const pendingTasks = context.tasks.filter(t => t.status === 'todo');
    const completedTasks = context.tasks.filter(t => t.status === 'done');
    
    return `Vous avez ${context.tasks.length} tâches au total: ${pendingTasks.length} en attente, ${completedTasks.length} terminées. ${pendingTasks.length > 10 ? 'Beaucoup de tâches en attente, pensez à prioriser !' : ''}`;
  }
  
  // Analyse financière
  if (lowerMessage.includes('finance') || lowerMessage.includes('facture') || lowerMessage.includes('ca') || lowerMessage.includes('chiffre')) {
    const paidInvoices = context.invoices.filter(i => i.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
    const pendingInvoices = context.invoices.filter(i => i.status === 'sent' || i.status === 'pending');
    
    return `Chiffre d'affaires réalisé: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(totalRevenue)}. ${pendingInvoices.length} factures en attente de paiement.`;
  }
  
  // Analyse RH
  if (lowerMessage.includes('employé') || lowerMessage.includes('équipe') || lowerMessage.includes('rh')) {
    const activeEmployees = context.employees.filter(e => e.employment_status === 'active');
    return `Équipe actuelle: ${activeEmployees.length} employés actifs sur ${context.employees.length} au total.`;
  }
  
  // Analyse des devis
  if (lowerMessage.includes('devis') || lowerMessage.includes('quote')) {
    const pendingQuotes = context.devis.filter(d => d.status === 'sent' || d.status === 'pending');
    const acceptedQuotes = context.devis.filter(d => d.status === 'accepted');
    
    return `Devis: ${context.devis.length} au total, ${pendingQuotes.length} en attente, ${acceptedQuotes.length} acceptés.`;
  }
  
  // Salutations et aide
  if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut') || lowerMessage.includes('hello')) {
    return `Bonjour ! Je suis Synapse, votre assistant IA. Je peux vous aider avec vos projets, tâches, finances et équipe. Que souhaitez-vous savoir ?`;
  }
  
  if (lowerMessage.includes('aide') || lowerMessage.includes('help')) {
    return `Je peux vous renseigner sur: vos projets, tâches, finances, équipe, devis et factures. Posez-moi une question spécifique !`;
  }
  
  // Réponse par défaut avec suggestions contextuelles
  const suggestions: string[] = [];
  if (context.projects.length > 0) suggestions.push('vos projets');
  if (context.tasks.length > 0) suggestions.push('vos tâches');
  if (context.invoices.length > 0) suggestions.push('vos finances');
  if (context.employees.length > 0) suggestions.push('votre équipe');
  
  return `Je n'ai pas bien compris votre demande. Je peux vous aider avec: ${suggestions.join(', ')}. Reformulez votre question ?`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400, headers: corsHeaders });
  }

  try {
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    console.log("🎙️ Synapse Live Voice WebSocket connection established");

    // Initialiser Supabase client pour récupérer les données contextuelles
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    let contextualData: ContextualData = {
      projects: [],
      employees: [],
      tasks: [],
      devis: [],
      invoices: [],
      userRole: 'client',
      userId: ''
    };

    socket.onopen = () => {
      console.log("✅ Synapse WebSocket opened");
      socket.send(JSON.stringify({
        type: 'connection_established',
        message: 'Synapse IA connecté et prêt à vous assister !',
        timestamp: new Date().toISOString(),
        features: ['analyse_contextuelle', 'données_temps_réel', 'suggestions_intelligentes']
      }));
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📨 Received message:", data.type, data.message?.substring(0, 50));

        switch (data.type) {
          case 'init_context':
            // Initialiser le contexte utilisateur
            if (data.userId) {
              contextualData.userId = data.userId;
              contextualData.userRole = data.userRole || 'client';
              
              // Charger les données contextuelles
              try {
                // Récupérer d'abord les informations utilisateur pour obtenir company_id
                const { data: userData, error: userError } = await supabase
                  .from('users')
                  .select('*')
                  .eq('id', data.userId)
                  .single();

                let userCompanyId = userData?.company_id;
                console.log(`👤 User data:`, { userId: data.userId, userCompanyId, userRole: contextualData.userRole });

                // Si pas de company_id, créer des données de démonstration
                if (!userCompanyId && contextualData.userRole === 'admin') {
                  console.log('🔧 Admin user without company_id, loading all available data');
                  
                  // Pour les admins, charger toutes les données disponibles
                  const [projectsRes, employeesRes, tasksRes, devisRes, invoicesRes, companiesRes] = await Promise.all([
                    supabase.from('projects').select('*').limit(50),
                    supabase.from('employees').select('*').limit(100),
                    supabase.from('tasks').select('*').limit(100),
                    supabase.from('devis').select('*').limit(50),
                    supabase.from('invoices').select('*').limit(50),
                    supabase.from('companies').select('*').limit(10)
                  ]);

                  contextualData = {
                    ...contextualData,
                    projects: projectsRes.data || [],
                    employees: employeesRes.data || [],
                    tasks: tasksRes.data || [],
                    devis: devisRes.data || [],
                    invoices: invoicesRes.data || []
                  };

                } else if (userCompanyId) {
                  console.log(`🏢 Loading data for company: ${userCompanyId}`);
                  
                  // Récupérer d'abord les branches de l'entreprise
                  const { data: branches } = await supabase
                    .from('branches')
                    .select('id')
                    .eq('company_id', userCompanyId);
                  
                  const branchIds = branches?.map(b => b.id) || [];
                  console.log(`🏢 Found ${branchIds.length} branches for company`);
                  
                  // Charger les données filtrées par company_id et branch_ids
                  const [projectsRes, employeesRes, tasksRes, devisRes, invoicesRes] = await Promise.all([
                    supabase.from('projects').select('*').eq('client_company_id', userCompanyId).limit(50),
                    branchIds.length > 0 
                      ? supabase.from('employees').select('*').in('branch_id', branchIds).limit(100)
                      : supabase.from('employees').select('*').limit(0), // Pas d'employés si pas de branches
                    supabase.from('tasks').select('*, project:projects!inner(client_company_id)')
                      .eq('project.client_company_id', userCompanyId).limit(100),
                    supabase.from('devis').select('*').eq('company_id', userCompanyId).limit(50),
                    supabase.from('invoices').select('*').eq('company_id', userCompanyId).limit(50)
                  ]);

                  contextualData = {
                    ...contextualData,
                    projects: projectsRes.data || [],
                    employees: employeesRes.data || [],
                    tasks: tasksRes.data || [],
                    devis: devisRes.data || [],
                    invoices: invoicesRes.data || []
                  };

                } else {
                  // Utilisateur sans company_id - données limitées de démonstration
                  console.log('📊 Creating demo data for user without company_id');
                  
                  contextualData = {
                    ...contextualData,
                    projects: [
                      { id: 'demo-1', name: 'Projet de démonstration', status: 'in_progress', start_date: '2024-01-01', end_date: '2024-12-31' },
                      { id: 'demo-2', name: 'Migration système', status: 'planning', start_date: '2024-06-01', end_date: '2024-08-31' }
                    ],
                    employees: [
                      { id: 'demo-emp-1', first_name: 'Mamadou', last_name: 'Diouf', employment_status: 'active' },
                      { id: 'demo-emp-2', first_name: 'Fatou', last_name: 'Ba', employment_status: 'active' }
                    ],
                    tasks: [
                      { id: 'demo-task-1', title: 'Analyse des besoins', status: 'done', project_id: 'demo-1' },
                      { id: 'demo-task-2', title: 'Développement interface', status: 'in_progress', project_id: 'demo-1' },
                      { id: 'demo-task-3', title: 'Tests utilisateurs', status: 'todo', project_id: 'demo-1' }
                    ],
                    devis: [
                      { id: 'demo-devis-1', number: 'DEV-2024-001', status: 'sent', amount: 2500000 },
                      { id: 'demo-devis-2', number: 'DEV-2024-002', status: 'accepted', amount: 5000000 }
                    ],
                    invoices: [
                      { id: 'demo-inv-1', number: 'FAC-2024-001', status: 'paid', amount: 2500000 },
                      { id: 'demo-inv-2', number: 'FAC-2024-002', status: 'sent', amount: 1800000 }
                    ]
                  };
                }
                
                console.log(`🧠 Context loaded: ${contextualData.projects.length} projects, ${contextualData.tasks.length} tasks, ${contextualData.employees.length} employees`);
                
                socket.send(JSON.stringify({
                  type: 'context_loaded',
                  message: 'Contexte chargé ! Je peux maintenant vous donner des informations précises sur vos données.',
                  timestamp: new Date().toISOString(),
                  stats: {
                    projects: contextualData.projects.length,
                    tasks: contextualData.tasks.length,
                    employees: contextualData.employees.length,
                    devis: contextualData.devis.length,
                    invoices: contextualData.invoices.length
                  }
                }));
              } catch (error) {
                console.error("❌ Error loading context:", error);
                socket.send(JSON.stringify({
                  type: 'context_error',
                  message: `Erreur lors du chargement du contexte: ${error.message}`,
                  timestamp: new Date().toISOString(),
                  details: error
                }));
              }
            }
            break;

          case 'voice_input':
          case 'text_input':
            // Traitement intelligent du message avec contexte
            const userMessage = data.message || '';
            const response = generateContextualResponse(userMessage, contextualData);
            
            console.log(`🤖 AI Response generated for: "${userMessage.substring(0, 30)}..."`);
            
            socket.send(JSON.stringify({
              type: 'ai_response',
              message: response,
              timestamp: new Date().toISOString(),
              confidence: 0.95,
              source: 'synapse_contextual_ai'
            }));
            break;

          case 'refresh_context':
            // Rafraîchir les données contextuelles
            try {
              const [projectsRes, tasksRes] = await Promise.all([
                supabase.from('projects').select('*').limit(50),
                supabase.from('tasks').select('*').limit(100)
              ]);
              
              contextualData.projects = projectsRes.data || [];
              contextualData.tasks = tasksRes.data || [];
              
              socket.send(JSON.stringify({
                type: 'context_refreshed',
                message: 'Données mises à jour !',
                timestamp: new Date().toISOString()
              }));
            } catch (error) {
              console.error("❌ Error refreshing context:", error);
            }
            break;

          case 'ping':
            socket.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString(),
              status: 'active'
            }));
            break;

          default:
            // Log du message inconnu pour debugging
            console.log(`❓ Unknown message type: ${data.type}`, data);
            
            // Ne pas envoyer d'erreur pour les messages système internes
            if (data.type && (data.type.startsWith('_') || data.type === 'keepalive' || data.type === 'system')) {
              // Ignore les messages système
              break;
            }
            
            socket.send(JSON.stringify({
              type: 'warning',
              message: `Type de message non supporté: ${data.type}`,
              timestamp: new Date().toISOString(),
              received_type: data.type
            }));
        }
      } catch (error) {
        console.error("❌ Error processing message:", error);
        socket.send(JSON.stringify({
          type: 'error',
          message: 'Erreur de traitement du message',
          timestamp: new Date().toISOString(),
          details: error.message
        }));
      }
    };

    socket.onclose = () => {
      console.log("🔌 Synapse WebSocket connection closed");
    };

    socket.onerror = (error) => {
      console.error("❌ Synapse WebSocket error:", error);
    };

    return response;

  } catch (error) {
    console.error("❌ Error creating Synapse WebSocket:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      service: 'synapse-live-voice'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});