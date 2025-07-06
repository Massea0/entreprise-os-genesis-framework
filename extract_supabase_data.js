/**
 * Script pour extraire les données Supabase en JSON
 * Usage: node extract_supabase_data.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Configuration Supabase (récupérée depuis les variables d'environnement)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.log('Définissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

async function extractSupabaseData() {
  console.log('🔍 Extraction des données Supabase...');
  console.log('=' * 50);
  
  // Initialiser le client Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  // Tables à vérifier
  const tables = ['projects', 'employees', 'tasks', 'devis', 'invoices'];
  
  const results = {};
  
  // Extraire les données de chaque table
  for (const table of tables) {
    try {
      console.log(`📊 Extraction de la table '${table}'...`);
      
      // Récupérer les données
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(10);
      
      if (error) {
        throw error;
      }
      
      results[table] = {
        count: count || 0,
        sample_data: data || [],
        total_records: count || 0
      };
      
      console.log(`   ✅ ${count || 0} enregistrements trouvés (échantillon: ${(data || []).length})`);
      
    } catch (error) {
      console.log(`   ❌ Erreur pour la table '${table}': ${error.message}`);
      results[table] = {
        error: error.message,
        count: 0,
        sample_data: [],
        total_records: 0
      };
    }
  }
  
  // Récupérer les informations utilisateur
  try {
    console.log('👤 Extraction des utilisateurs authentifiés...');
    
    // Récupérer l'utilisateur actuel si connecté
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw error;
    }
    
    results.current_user = user ? {
      id: user.id,
      email: user.email,
      role: user.role,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata,
      created_at: user.created_at
    } : null;
    
    console.log(`   ✅ Utilisateur actuel: ${user?.email || 'Non connecté'}`);
    
  } catch (error) {
    console.log(`   ❌ Erreur pour l'utilisateur: ${error.message}`);
    results.current_user = null;
  }
  
  // Vérifier la structure des tables
  try {
    console.log('🏗️ Vérification de la structure des tables...');
    
    results.table_structure = {};
    
    for (const table of tables) {
      try {
        // Essayer de récupérer un enregistrement pour voir la structure
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error && data && data.length > 0) {
          results.table_structure[table] = Object.keys(data[0]);
        } else {
          results.table_structure[table] = [];
        }
        
      } catch (e) {
        results.table_structure[table] = [];
      }
    }
    
    console.log('   ✅ Structure des tables analysée');
    
  } catch (error) {
    console.log(`   ❌ Erreur lors de l'analyse de structure: ${error.message}`);
  }
  
  // Sauvegarder les résultats
  const outputFile = 'supabase_data_extract.json';
  try {
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`\n📄 Données extraites et sauvegardées dans '${outputFile}'`);
  } catch (error) {
    console.error(`❌ Erreur lors de la sauvegarde: ${error.message}`);
  }
  
  // Afficher un résumé
  console.log('\n📊 RÉSUMÉ:');
  console.log('────────────────────────────────────────');
  
  for (const [table, data] of Object.entries(results)) {
    if (table === 'current_user') {
      console.log(`   👤 current_user: ${data ? `✅ ${data.email}` : '❌ Non connecté'}`);
    } else if (table === 'table_structure') {
      console.log(`   🏗️ table_structure: ✅ Analysée`);
    } else if (data.error) {
      console.log(`   📋 ${table}: ❌ ${data.error}`);
    } else {
      console.log(`   📋 ${table}: ✅ ${data.total_records} enregistrements`);
    }
  }
  
  console.log('\n💡 Pour voir les détails, consultez le fichier JSON généré.');
  
  return results;
}

// Exécuter le script
extractSupabaseData().catch(console.error);
