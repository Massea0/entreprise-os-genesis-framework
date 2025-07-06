-- Correction des politiques RLS pour task_assignment_suggestions
DROP POLICY IF EXISTS "Allow insert from edge functions" ON task_assignment_suggestions;
DROP POLICY IF EXISTS "Service role can manage assignment suggestions" ON task_assignment_suggestions;
DROP POLICY IF EXISTS "Users can view assignment suggestions for accessible tasks" ON task_assignment_suggestions;

-- Politique globale pour service role (edge functions)
CREATE POLICY "Service role can manage all assignment suggestions" 
ON task_assignment_suggestions FOR ALL 
USING (auth.role() = 'service_role');

-- Politique pour utilisateurs authentifiés  
CREATE POLICY "Users can view assignment suggestions for their tasks" 
ON task_assignment_suggestions FOR SELECT 
USING (
  auth.role() = 'authenticated' AND (
    task_id IN (
      SELECT t.id 
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE (
        auth.uid() IN (SELECT u.id FROM users u WHERE u.role = 'admin') OR
        auth.uid() = t.assignee_id OR 
        auth.uid() = p.owner_id OR
        auth.uid() IN (SELECT u.id FROM users u WHERE u.role = 'client' AND u.company_id = p.client_company_id)
      )
    )
  )
);