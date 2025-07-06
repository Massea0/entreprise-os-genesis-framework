/**
 * Script pour ajouter des données de démonstration via l'API Supabase
 * Exécuter avec: node add-demo-data.js
 */

import { createClient } from '@supabase/supabase-js'

// Configuration Supabase (remplacez par vos vraies valeurs)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY'
const supabase = createClient(supabaseUrl, supabaseKey)

const USER_ID = '05abd360-84e0-44a9-b708-1537ec50b6cc'

async function addDemoData() {
  try {
    console.log('🚀 Ajout des données de démonstration...')

    // 1. Ajouter des entreprises
    const companies = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Arcadis Tech Solutions',
        email: 'contact@arcadis.tech',
        phone: '+221 77 123 45 67',
        address: 'Dakar, Sénégal'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Digital Innovation Hub',
        email: 'info@dihub.sn',
        phone: '+221 78 987 65 43',
        address: 'Thiès, Sénégal'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'TechCorp Africa',
        email: 'hello@techcorp.africa',
        phone: '+221 76 555 12 34',
        address: 'Saint-Louis, Sénégal'
      }
    ]

    console.log('📊 Ajout des entreprises...')
    const { data: companiesData, error: companiesError } = await supabase
      .from('companies')
      .upsert(companies, { onConflict: 'id' })

    if (companiesError) {
      console.log('⚠️ Erreur entreprises (peut-être normale):', companiesError.message)
    } else {
      console.log('✅ Entreprises ajoutées')
    }

    // 2. Mettre à jour l'utilisateur avec une company_id
    console.log('👤 Mise à jour utilisateur...')
    const { error: userError } = await supabase
      .from('users')
      .update({ company_id: '550e8400-e29b-41d4-a716-446655440001' })
      .eq('id', USER_ID)

    if (userError) {
      console.log('⚠️ Erreur utilisateur:', userError.message)
    } else {
      console.log('✅ Utilisateur mis à jour')
    }

    // 3. Ajouter des projets
    const projects = [
      {
        id: 'proj-001',
        name: 'Système de gestion RH',
        description: 'Développement d\'un système complet de gestion des ressources humaines',
        client_company_id: '550e8400-e29b-41d4-a716-446655440001',
        status: 'in_progress',
        start_date: '2024-01-15T00:00:00Z',
        end_date: '2024-08-30T00:00:00Z',
        budget: 15000000
      },
      {
        id: 'proj-002',
        name: 'Application mobile e-commerce',
        description: 'Création d\'une application mobile pour le commerce électronique',
        client_company_id: '550e8400-e29b-41d4-a716-446655440002',
        status: 'in_progress',
        start_date: '2024-03-01T00:00:00Z',
        end_date: '2024-10-15T00:00:00Z',
        budget: 25000000
      },
      {
        id: 'proj-003',
        name: 'Migration Cloud AWS',
        description: 'Migration de l\'infrastructure vers AWS',
        client_company_id: '550e8400-e29b-41d4-a716-446655440001',
        status: 'planning',
        start_date: '2024-07-01T00:00:00Z',
        end_date: '2024-12-31T00:00:00Z',
        budget: 8000000
      },
      {
        id: 'proj-004',
        name: 'Site vitrine corporate',
        description: 'Refonte du site web corporate',
        client_company_id: '550e8400-e29b-41d4-a716-446655440003',
        status: 'completed',
        start_date: '2023-11-01T00:00:00Z',
        end_date: '2024-02-29T00:00:00Z',
        budget: 3500000
      },
      {
        id: 'proj-005',
        name: 'IA pour la finance',
        description: 'Implémentation d\'outils IA pour l\'analyse financière',
        client_company_id: '550e8400-e29b-41d4-a716-446655440002',
        status: 'in_progress',
        start_date: '2024-04-15T00:00:00Z',
        end_date: '2024-09-30T00:00:00Z',
        budget: 12000000
      }
    ]

    console.log('🚧 Ajout des projets...')
    const { error: projectsError } = await supabase
      .from('projects')
      .upsert(projects, { onConflict: 'id' })

    if (projectsError) {
      console.log('⚠️ Erreur projets:', projectsError.message)
    } else {
      console.log('✅ Projets ajoutés')
    }

    // 4. Ajouter des tâches
    const tasks = [
      {
        id: 'task-001',
        project_id: 'proj-001',
        title: 'Analyse des besoins RH',
        description: 'Analyse complète des besoins en gestion RH',
        status: 'done',
        priority: 'high',
        estimated_hours: 40
      },
      {
        id: 'task-002',
        project_id: 'proj-001',
        title: 'Conception base de données',
        description: 'Conception du schéma de base de données',
        status: 'done',
        priority: 'high',
        estimated_hours: 32
      },
      {
        id: 'task-003',
        project_id: 'proj-001',
        title: 'Développement interface utilisateur',
        description: 'Développement de l\'interface web',
        status: 'in_progress',
        priority: 'high',
        estimated_hours: 80
      },
      {
        id: 'task-004',
        project_id: 'proj-001',
        title: 'Intégration API',
        description: 'Intégration des APIs externes',
        status: 'todo',
        priority: 'medium',
        estimated_hours: 24
      },
      {
        id: 'task-005',
        project_id: 'proj-002',
        title: 'Maquettage mobile',
        description: 'Création des maquettes pour l\'application mobile',
        status: 'done',
        priority: 'high',
        estimated_hours: 16
      },
      {
        id: 'task-006',
        project_id: 'proj-002',
        title: 'Développement iOS',
        description: 'Développement version iOS',
        status: 'in_progress',
        priority: 'high',
        estimated_hours: 120
      },
      {
        id: 'task-007',
        project_id: 'proj-002',
        title: 'Développement Android',
        description: 'Développement version Android',
        status: 'in_progress',
        priority: 'high',
        estimated_hours: 120
      },
      {
        id: 'task-008',
        project_id: 'proj-002',
        title: 'Tests utilisateurs',
        description: 'Tests avec les utilisateurs finaux',
        status: 'todo',
        priority: 'medium',
        estimated_hours: 32
      }
    ]

    console.log('📋 Ajout des tâches...')
    const { error: tasksError } = await supabase
      .from('tasks')
      .upsert(tasks, { onConflict: 'id' })

    if (tasksError) {
      console.log('⚠️ Erreur tâches:', tasksError.message)
    } else {
      console.log('✅ Tâches ajoutées')
    }

    // 5. Ajouter des devis
    const devis = [
      {
        id: 'devis-001',
        number: 'DEV-2024-001',
        company_id: '550e8400-e29b-41d4-a716-446655440001',
        object: 'Développement système RH complet',
        amount: 15000000,
        status: 'accepted',
        valid_until: '2024-12-31T00:00:00Z',
        notes: 'Devis pour système RH avec modules paie et congés'
      },
      {
        id: 'devis-002',
        number: 'DEV-2024-002',
        company_id: '550e8400-e29b-41d4-a716-446655440002',
        object: 'Application mobile e-commerce',
        amount: 25000000,
        status: 'sent',
        valid_until: '2024-08-31T00:00:00Z',
        notes: 'Includes iOS and Android development'
      },
      {
        id: 'devis-003',
        number: 'DEV-2024-003',
        company_id: '550e8400-e29b-41d4-a716-446655440003',
        object: 'Refonte site web',
        amount: 3500000,
        status: 'accepted',
        valid_until: '2024-06-30T00:00:00Z',
        notes: 'Site responsive avec CMS'
      }
    ]

    console.log('💰 Ajout des devis...')
    const { error: devisError } = await supabase
      .from('devis')
      .upsert(devis, { onConflict: 'id' })

    if (devisError) {
      console.log('⚠️ Erreur devis:', devisError.message)
    } else {
      console.log('✅ Devis ajoutés')
    }

    // 6. Ajouter des factures
    const invoices = [
      {
        id: 'inv-001',
        number: 'FAC-2024-001',
        company_id: '550e8400-e29b-41d4-a716-446655440001',
        amount: 5000000,
        status: 'paid',
        due_date: '2024-02-29T00:00:00Z',
        object: 'Acompte système RH - 1ère tranche',
        currency: 'XOF'
      },
      {
        id: 'inv-002',
        number: 'FAC-2024-002',
        company_id: '550e8400-e29b-41d4-a716-446655440003',
        amount: 3500000,
        status: 'paid',
        due_date: '2024-03-31T00:00:00Z',
        object: 'Site web corporate - Paiement final',
        currency: 'XOF'
      },
      {
        id: 'inv-003',
        number: 'FAC-2024-003',
        company_id: '550e8400-e29b-41d4-a716-446655440001',
        amount: 7500000,
        status: 'sent',
        due_date: '2024-08-31T00:00:00Z',
        object: 'Système RH - 2ème tranche',
        currency: 'XOF'
      }
    ]

    console.log('🧾 Ajout des factures...')
    const { error: invoicesError } = await supabase
      .from('invoices')
      .upsert(invoices, { onConflict: 'id' })

    if (invoicesError) {
      console.log('⚠️ Erreur factures:', invoicesError.message)
    } else {
      console.log('✅ Factures ajoutées')
    }

    // 7. Vérifier les données
    console.log('\n📊 Vérification des données...')
    
    const { data: projectsCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
    
    const { data: tasksCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
    
    const { data: devisCount } = await supabase
      .from('devis')
      .select('*', { count: 'exact', head: true })
    
    const { data: invoicesCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })

    console.log('📈 Résumé des données:')
    console.log(`   Projets: ${projectsCount?.length || 'N/A'}`)
    console.log(`   Tâches: ${tasksCount?.length || 'N/A'}`)
    console.log(`   Devis: ${devisCount?.length || 'N/A'}`)
    console.log(`   Factures: ${invoicesCount?.length || 'N/A'}`)

    console.log('\n🎉 Données de démonstration ajoutées avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des données:', error)
  }
}

// Exécuter le script
addDemoData()
