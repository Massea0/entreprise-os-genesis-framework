import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Initialiser Supabase client avec la clé de service
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🚀 Configuration des données de test pour utilisateur: ${userId}`);

    // 1. Créer une entreprise de test
    console.log('📦 Création de l\'entreprise de test...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .upsert({
        id: '12345678-1234-5678-9abc-123456789012',
        name: 'Arcadis Tech SARL',
        email: 'contact@arcadis.tech',
        phone: '+221 33 123 45 67',
        address: 'Dakar, Sénégal'
      })
      .select()
      .single();

    if (companyError) {
      console.error('❌ Erreur création entreprise:', companyError);
      throw companyError;
    }

    const companyId = company.id;
    console.log('✅ Entreprise créée:', company.name);

    // 2. Assigner l'entreprise à l'utilisateur
    console.log('👤 Mise à jour de l\'utilisateur...');
    const { error: userError } = await supabase
      .from('users')
      .update({ 
        company_id: companyId,
        role: 'admin' 
      })
      .eq('id', userId);

    if (userError) {
      console.error('❌ Erreur mise à jour utilisateur:', userError);
      throw userError;
    }

    console.log('✅ Utilisateur mis à jour avec company_id:', companyId);

    // 3. Créer des branches
    console.log('🏢 Création des branches...');
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .upsert({
        id: '87654321-4321-8765-dcba-210987654321',
        name: 'Siège Social Dakar',
        code: 'DKR-HQ',
        description: 'Siège social principal à Dakar',
        country: 'SN',
        city: 'Dakar',
        address: 'Zone de Captage, Dakar',
        is_headquarters: true,
        company_id: companyId
      })
      .select()
      .single();

    if (branchError) {
      console.error('❌ Erreur création branche:', branchError);
      throw branchError;
    }

    const branchId = branch.id;
    console.log('✅ Branche créée:', branch.name);

    // 4. Créer des projets
    console.log('📊 Création des projets...');
    const projects = [
      {
        id: '88888888-8888-8888-8888-888888888888',
        name: 'Plateforme MySpace',
        description: 'Développement de la plateforme de gestion d\'entreprise',
        client_company_id: companyId,
        status: 'in_progress',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        budget: 15000000,
        owner_id: userId
      },
      {
        id: '99999999-9999-9999-9999-999999999999',
        name: 'Migration Système Legacy',
        description: 'Migration des anciens systèmes vers la nouvelle architecture',
        client_company_id: companyId,
        status: 'planning',
        start_date: '2024-07-01T00:00:00Z',
        end_date: '2024-10-31T23:59:59Z',
        budget: 8000000,
        owner_id: userId
      },
      {
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        name: 'Site Web Corporate',
        description: 'Refonte complète du site web de l\'entreprise',
        client_company_id: companyId,
        status: 'completed',
        start_date: '2023-10-01T00:00:00Z',
        end_date: '2024-02-28T23:59:59Z',
        budget: 4500000,
        owner_id: userId
      }
    ];

    for (const proj of projects) {
      const { error } = await supabase.from('projects').upsert(proj);
      if (error) {
        console.error('❌ Erreur projet:', error);
      } else {
        console.log('✅ Projet créé:', proj.name);
      }
    }

    // 5. Créer des tâches
    console.log('📋 Création des tâches...');
    const tasks = [
      {
        id: 'task-1111-1111-1111-111111111111',
        project_id: '88888888-8888-8888-8888-888888888888',
        title: 'Analyse des besoins utilisateurs',
        description: 'Collecte et analyse des besoins fonctionnels',
        status: 'done',
        priority: 'high',
        estimated_hours: 40,
        actual_hours: 38
      },
      {
        id: 'task-2222-2222-2222-222222222222',
        project_id: '88888888-8888-8888-8888-888888888888',
        title: 'Développement interface utilisateur',
        description: 'Création des interfaces principales de l\'application',
        status: 'in_progress',
        priority: 'high',
        estimated_hours: 80,
        actual_hours: 45
      },
      {
        id: 'task-3333-3333-3333-333333333333',
        project_id: '88888888-8888-8888-8888-888888888888',
        title: 'Tests de performance',
        description: 'Tests de charge et optimisation',
        status: 'todo',
        priority: 'medium',
        estimated_hours: 30
      },
      {
        id: 'task-4444-4444-4444-444444444444',
        project_id: '99999999-9999-9999-9999-999999999999',
        title: 'Audit système legacy',
        description: 'Évaluation des systèmes existants',
        status: 'in_progress',
        priority: 'high',
        estimated_hours: 60,
        actual_hours: 20
      },
      {
        id: 'task-5555-5555-5555-555555555555',
        project_id: '99999999-9999-9999-9999-999999999999',
        title: 'Migration base de données',
        description: 'Migration des données vers le nouveau système',
        status: 'todo',
        priority: 'critical',
        estimated_hours: 120
      }
    ];

    for (const task of tasks) {
      const { error } = await supabase.from('tasks').upsert(task);
      if (error) {
        console.error('❌ Erreur tâche:', error);
      } else {
        console.log('✅ Tâche créée:', task.title);
      }
    }

    // 6. Créer des devis
    console.log('📄 Création des devis...');
    const devis = [
      {
        id: 'devis-1111-1111-1111-111111111111',
        number: 'DEV-2024-001',
        company_id: companyId,
        object: 'Développement application mobile',
        amount: 5500000,
        status: 'sent',
        valid_until: '2024-08-31T23:59:59Z'
      },
      {
        id: 'devis-2222-2222-2222-222222222222',
        number: 'DEV-2024-002',
        company_id: companyId,
        object: 'Consulting stratégique digital',
        amount: 3200000,
        status: 'accepted',
        valid_until: '2024-09-30T23:59:59Z',
        validated_at: '2024-06-15T10:30:00Z'
      },
      {
        id: 'devis-3333-3333-3333-333333333333',
        number: 'DEV-2024-003',
        company_id: companyId,
        object: 'Formation équipe développement',
        amount: 1800000,
        status: 'pending',
        valid_until: '2024-12-31T23:59:59Z'
      }
    ];

    for (const devi of devis) {
      const { error } = await supabase.from('devis').upsert(devi);
      if (error) {
        console.error('❌ Erreur devis:', error);
      } else {
        console.log('✅ Devis créé:', devi.number);
      }
    }

    // 7. Créer des factures
    console.log('💰 Création des factures...');
    const invoices = [
      {
        id: 'invoice-1111-1111-1111-111111111111',
        number: 'FAC-2024-001',
        company_id: companyId,
        object: 'Développement Phase 1',
        amount: 3200000,
        status: 'paid',
        due_date: '2024-07-15T23:59:59Z',
        paid_at: '2024-07-10T14:20:00Z'
      },
      {
        id: 'invoice-2222-2222-2222-222222222222',
        number: 'FAC-2024-002',
        company_id: companyId,
        object: 'Maintenance mensuelle',
        amount: 850000,
        status: 'sent',
        due_date: '2024-08-31T23:59:59Z'
      },
      {
        id: 'invoice-3333-3333-3333-333333333333',
        number: 'FAC-2024-003',
        company_id: companyId,
        object: 'Formation utilisateurs',
        amount: 1200000,
        status: 'pending',
        due_date: '2024-09-15T23:59:59Z'
      },
      {
        id: 'invoice-4444-4444-4444-444444444444',
        number: 'FAC-2024-004',
        company_id: companyId,
        object: 'Hébergement et maintenance',
        amount: 650000,
        status: 'overdue',
        due_date: '2024-06-30T23:59:59Z'
      }
    ];

    for (const invoice of invoices) {
      const { error } = await supabase.from('invoices').upsert(invoice);
      if (error) {
        console.error('❌ Erreur facture:', error);
      } else {
        console.log('✅ Facture créée:', invoice.number);
      }
    }

    // 8. Créer des employés
    console.log('👥 Création des employés...');
    const employees = [
      {
        id: 'emp-1111-1111-1111-111111111111',
        user_id: userId,
        employee_number: 'EMP001',
        first_name: 'Mamadou',
        last_name: 'Diouf',
        work_email: 'mdiouf@arcadis.tech',
        branch_id: branchId,
        department_id: '11111111-1111-1111-1111-111111111111',
        position_id: '44444444-4444-4444-4444-444444444444',
        hire_date: '2023-01-15',
        start_date: '2023-01-15',
        employment_status: 'active',
        current_salary: 1200000
      },
      {
        id: 'emp-2222-2222-2222-222222222222',
        employee_number: 'EMP002',
        first_name: 'Fatou',
        last_name: 'Ba',
        work_email: 'fba@arcadis.tech',
        branch_id: branchId,
        department_id: '11111111-1111-1111-1111-111111111111',
        position_id: '33333333-3333-3333-3333-333333333333',
        hire_date: '2023-03-01',
        start_date: '2023-03-01',
        employment_status: 'active',
        current_salary: 950000
      },
      {
        id: 'emp-3333-3333-3333-333333333333',
        employee_number: 'EMP003',
        first_name: 'Ibrahima',
        last_name: 'Sall',
        work_email: 'isall@arcadis.tech',
        branch_id: branchId,
        department_id: '22222222-2222-2222-2222-222222222222',
        position_id: '33333333-3333-3333-3333-333333333333',
        hire_date: '2023-05-15',
        start_date: '2023-05-15',
        employment_status: 'active',
        current_salary: 850000
      }
    ];

    for (const emp of employees) {
      const { error } = await supabase.from('employees').upsert(emp);
      if (error) {
        console.error('❌ Erreur employé:', error);
      } else {
        console.log('✅ Employé créé:', `${emp.first_name} ${emp.last_name}`);
      }
    }

    console.log('🎉 Configuration terminée avec succès !');
    const summary = {
      success: true,
      message: 'Données de test configurées avec succès',
      data: {
        companyId,
        branchId,
        userId,
        counts: {
          projects: 3,
          tasks: 5,
          devis: 3,
          invoices: 4,
          employees: 3
        }
      }
    };

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
