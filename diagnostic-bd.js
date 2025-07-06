// Script de diagnostic pour identifier les contraintes de la base de données
import { supabase } from './src/integrations/supabase/client.js';

async function diagnoseBDConstraints() {
  console.log('=== DIAGNOSTIC DES CONTRAINTES BD ===');
  
  // Test des employés pour l'organigramme
  console.log('\n1. Test des employés (organigramme):');
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, first_name, last_name, position_id, manager_id, positions(title)')
    .limit(5);
  
  console.log('Employees data:', employees);
  console.log('Employees error:', empError);
  
  // Test des tâches pour identifier les statuts valides
  console.log('\n2. Test des tâches (Kanban):');
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, title, status, priority')
    .limit(5);
  
  console.log('Tasks data:', tasks);
  console.log('Tasks error:', tasksError);
  
  // Test d'une mise à jour avec différents statuts pour identifier la contrainte
  console.log('\n3. Test des statuts valides:');
  const testStatuses = ['todo', 'in_progress', 'review', 'done', 'pending', 'completed', 'backlog'];
  
  if (tasks && tasks.length > 0) {
    const testTaskId = tasks[0].id;
    const originalStatus = tasks[0].status;
    
    for (const status of testStatuses) {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ status })
          .eq('id', testTaskId);
        
        if (error) {
          console.log(`❌ Status "${status}": ${error.message}`);
        } else {
          console.log(`✅ Status "${status}": OK`);
          // Remettre le statut original immédiatement
          await supabase
            .from('tasks')
            .update({ status: originalStatus })
            .eq('id', testTaskId);
        }
      } catch (err) {
        console.log(`❌ Status "${status}": ${err.message}`);
      }
    }
  }
}

diagnoseBDConstraints();
