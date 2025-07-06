import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const DatabaseDiagnostic = () => {
  const [taskData, setTaskData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);

  useEffect(() => {
    const diagnose = async () => {
      // Test des tâches existantes pour voir les statuts valides
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, status, priority')
        .limit(10);
      
      console.log('=== DIAGNOSTIC ===');
      console.log('Tasks from DB:', tasks);
      console.log('Tasks error:', tasksError);
      
      // Si on a des tâches, afficher les statuts uniques
      if (tasks && tasks.length > 0) {
        const uniqueStatuses = [...new Set(tasks.map(t => t.status))];
        const uniquePriorities = [...new Set(tasks.map(t => t.priority))];
        console.log('Status uniques dans la DB:', uniqueStatuses);
        console.log('Priorities uniques dans la DB:', uniquePriorities);
      }
      
      setTaskData({ tasks, error: tasksError });

      // Test des employés pour l'organigramme
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, position_id, manager_id, positions(title)')
        .limit(10);
      
      console.log('Employees from DB:', employees);
      console.log('Employees error:', empError);
      setEmployeeData({ employees, error: empError });
    };

    diagnose();
  }, []);

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Diagnostic Base de Données</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Tâches (Status/Priority):</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded">
              {JSON.stringify(taskData, null, 2)}
            </pre>
          </div>
          <div>
            <h3 className="font-semibold">Employés (Organigramme):</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded">
              {JSON.stringify(employeeData, null, 2)}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
