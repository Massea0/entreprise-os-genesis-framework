-- Create task comments table
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for task comments
CREATE POLICY "Users can view comments for accessible tasks" 
ON public.task_comments 
FOR SELECT 
USING (
  task_id IN (
    SELECT t.id 
    FROM tasks t 
    JOIN projects p ON p.id = t.project_id 
    WHERE (
      auth.uid() IN (
        SELECT u.id FROM users u 
        WHERE u.role = 'client' AND u.company_id = p.client_company_id
      ) OR 
      auth.uid() = t.assignee_id OR 
      auth.uid() = p.owner_id OR 
      auth.uid() IN (
        SELECT u.id FROM users u WHERE u.role = 'admin'
      )
    )
  )
);

CREATE POLICY "Users can create comments for accessible tasks" 
ON public.task_comments 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  task_id IN (
    SELECT t.id 
    FROM tasks t 
    JOIN projects p ON p.id = t.project_id 
    WHERE (
      auth.uid() IN (
        SELECT u.id FROM users u 
        WHERE u.role = 'client' AND u.company_id = p.client_company_id
      ) OR 
      auth.uid() = t.assignee_id OR 
      auth.uid() = p.owner_id OR 
      auth.uid() IN (
        SELECT u.id FROM users u WHERE u.role = 'admin'
      )
    )
  )
);

CREATE POLICY "Users can update their own comments" 
ON public.task_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.task_comments 
FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() IN (
  SELECT u.id FROM users u WHERE u.role = 'admin'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_task_comments_updated_at
BEFORE UPDATE ON public.task_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();