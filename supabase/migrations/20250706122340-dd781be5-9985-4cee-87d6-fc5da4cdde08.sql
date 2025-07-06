
-- Enable Row Level Security on ai_tasks_log table
ALTER TABLE public.ai_tasks_log ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage all AI task logs
CREATE POLICY "Admins can manage all AI task logs"
ON public.ai_tasks_log
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Create policy for service role (for edge functions)
CREATE POLICY "Service role can manage AI task logs"
ON public.ai_tasks_log
FOR ALL
USING (auth.role() = 'service_role');

-- Create policy for users to view logs related to their actions
CREATE POLICY "Users can view their own AI task logs"
ON public.ai_tasks_log
FOR SELECT
USING (
  -- Allow if user is admin
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
  OR
  -- Allow if log is related to user's contract/company
  (
    contract_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.contracts c
      JOIN public.users u ON u.company_id = c.client_id
      WHERE c.id = ai_tasks_log.contract_id 
      AND u.id = auth.uid()
    )
  )
);
