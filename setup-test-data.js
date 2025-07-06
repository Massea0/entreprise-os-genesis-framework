#!/usr/bin/env node

/**
 * Script pour configurer des données de test réalistes dans Supabase
 * et assigner un company_id à l'utilisateur actuel
 */

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec service_role key pour les permissions d'écriture
const supabaseUrl = 'https://qlqgyrfqiflnqknbtycw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFscWd5cmZxaWZsbnFrbmJ0eWN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDEwMjQ1MSwiZXhwIjoyMDY1Njc4NDUxfQ.hjJN_YGXtGETh6ks2mAJ0wmwYDcATrTJCihG1aV8ppc';

const supabase = createClient(supabaseUrl, supabaseKey);

// ID de l'utilisateur actuel
const CURRENT_USER_ID = '05abd360-84e0-44a9-b708-1537ec50b6cc';

async function setupTestData() {
  console.log('🚀 Configuration des données de test...');

  try {
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
      return;
    }

    console.log('✅ Entreprise créée:', company.name);
    const companyId = company.id;

    // 2. Assigner l'entreprise à l'utilisateur actuel
    console.log('👤 Mise à jour de l\'utilisateur...');
    const { error: userError } = await supabase
      .from('users')
      .update({ 
        company_id: companyId,
        role: 'admin' 
      })
      .eq('id', CURRENT_USER_ID);

    if (userError) {
      console.error('❌ Erreur mise à jour utilisateur:', userError);
    } else {
      console.log('✅ Utilisateur mis à jour avec company_id:', companyId);
    }

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
      return;
    }

    const branchId = branch.id;
    console.log('✅ Branche créée:', branch.name);

    // 4. Créer des départements
    console.log('🏗️ Création des départements...');
    const departments = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Développement',
        code: 'DEV',
        description: 'Équipe de développement logiciel',
        branch_id: branchId
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Commercial',
        code: 'COM',
        description: 'Équipe commerciale et ventes',
        branch_id: branchId
      }
    ];

    for (const dept of departments) {
      const { error } = await supabase.from('departments').upsert(dept);
      if (error) {
        console.error('❌ Erreur département:', error);
      } else {
        console.log('✅ Département créé:', dept.name);
      }
    }

    // 5. Créer des postes
    console.log('💼 Création des postes...');
    const positions = [
      {
        id: '33333333-3333-3333-3333-333333333333',
        title: 'Développeur Senior',
        code: 'DEV-SR',
        description: 'Développeur expérimenté',
        department_id: '11111111-1111-1111-1111-111111111111',
        branch_id: branchId,
        level: 3,
        salary_min: 800000,
        salary_max: 1200000
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        title: 'Chef de Projet',
        code: 'PM',
        description: 'Gestionnaire de projets',
        department_id: '11111111-1111-1111-1111-111111111111',
        branch_id: branchId,
        level: 4,
        salary_min: 1000000,
        salary_max: 1500000
      }
    ];

    for (const pos of positions) {
      const { error } = await supabase.from('positions').upsert(pos);
      if (error) {
        console.error('❌ Erreur poste:', error);
      } else {
        console.log('✅ Poste créé:', pos.title);
      }
    }

    // 6. Créer des employés
    console.log('👥 Création des employés...');
    const employees = [
      {
        id: '55555555-5555-5555-5555-555555555555',
        user_id: CURRENT_USER_ID,
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
        id: '66666666-6666-6666-6666-666666666666',
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
        id: '77777777-7777-7777-7777-777777777777',
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

    // 7. Créer des projets
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
        owner_id: CURRENT_USER_ID
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
        owner_id: CURRENT_USER_ID
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

    // 8. Créer des tâches
    console.log('📋 Création des tâches...');
    const tasks = [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        project_id: '88888888-8888-8888-8888-888888888888',
        title: 'Analyse des besoins utilisateurs',
        description: 'Collecte et analyse des besoins fonctionnels',
        status: 'done',
        assignee_id: '55555555-5555-5555-5555-555555555555',
        priority: 'high',
        estimated_hours: 40,
        actual_hours: 38
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        project_id: '88888888-8888-8888-8888-888888888888',
        title: 'Développement interface utilisateur',
        description: 'Création des interfaces principales de l\'application',
        status: 'in_progress',
        assignee_id: '66666666-6666-6666-6666-666666666666',
        priority: 'high',
        estimated_hours: 80,
        actual_hours: 45
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        project_id: '88888888-8888-8888-8888-888888888888',
        title: 'Tests de performance',
        description: 'Tests de charge et optimisation',
        status: 'todo',
        assignee_id: '77777777-7777-7777-7777-777777777777',
        priority: 'medium',
        estimated_hours: 30
      },
      {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        project_id: '99999999-9999-9999-9999-999999999999',
        title: 'Audit système legacy',
        description: 'Évaluation des systèmes existants',
        status: 'in_progress',
        assignee_id: '55555555-5555-5555-5555-555555555555',
        priority: 'high',
        estimated_hours: 60,
        actual_hours: 20
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

    // 9. Créer des devis
    console.log('📄 Création des devis...');
    const devis = [
      {
        id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        number: 'DEV-2024-001',
        company_id: companyId,
        object: 'Développement application mobile',
        amount: 5500000,
        status: 'sent',
        valid_until: '2024-08-31T23:59:59Z'
      },
      {
        id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        number: 'DEV-2024-002',
        company_id: companyId,
        object: 'Consulting stratégique digital',
        amount: 3200000,
        status: 'accepted',
        valid_until: '2024-09-30T23:59:59Z',
        validated_at: '2024-06-15T10:30:00Z'
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

    // 10. Créer des factures
    console.log('💰 Création des factures...');
    const invoices = [
      {
        id: '10101010-1010-1010-1010-101010101010',
        number: 'FAC-2024-001',
        company_id: companyId,
        object: 'Développement Phase 1',
        amount: 3200000,
        status: 'paid',
        due_date: '2024-07-15T23:59:59Z',
        paid_at: '2024-07-10T14:20:00Z'
      },
      {
        id: '20202020-2020-2020-2020-202020202020',
        number: 'FAC-2024-002',
        company_id: companyId,
        object: 'Maintenance mensuelle',
        amount: 850000,
        status: 'sent',
        due_date: '2024-08-31T23:59:59Z'
      },
      {
        id: '30303030-3030-3030-3030-303030303030',
        number: 'FAC-2024-003',
        company_id: companyId,
        object: 'Formation utilisateurs',
        amount: 1200000,
        status: 'pending',
        due_date: '2024-09-15T23:59:59Z'
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

    console.log('🎉 Configuration terminée avec succès !');
    console.log('📊 Résumé des données créées :');
    console.log('   - 1 entreprise');
    console.log('   - 1 branche');
    console.log('   - 2 départements');
    console.log('   - 2 postes');
    console.log('   - 3 employés');
    console.log('   - 2 projets');
    console.log('   - 4 tâches');
    console.log('   - 2 devis');
    console.log('   - 3 factures');
    console.log(`   - Utilisateur ${CURRENT_USER_ID} assigné à l'entreprise ${companyId}`);

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
setupTestData();
