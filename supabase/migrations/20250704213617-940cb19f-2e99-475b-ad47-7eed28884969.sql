-- Fix infinite recursion in employees RLS policies
-- First, drop the problematic policy
DROP POLICY IF EXISTS "Managers can view their team" ON public.employees;

-- Create a security definer function to get user employee record
CREATE OR REPLACE FUNCTION public.get_current_user_employee_id()
RETURNS UUID AS $$
  SELECT id FROM public.employees WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create a safe policy for managers
CREATE POLICY "Managers can view their team" ON public.employees
FOR SELECT USING (
  manager_id = public.get_current_user_employee_id() OR 
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.role = ANY(ARRAY['hr_manager', 'hr_admin', 'super_admin', 'admin'])
  )
);