-- Améliorer la table task_comments pour un système comme GitLab
ALTER TABLE public.task_comments 
ADD COLUMN parent_comment_id UUID REFERENCES task_comments(id),
ADD COLUMN is_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN edit_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN mentions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;

-- Créer une table pour les réactions aux commentaires
CREATE TABLE public.task_comment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES task_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('thumbs_up', 'thumbs_down', 'heart', 'laugh', 'confused', 'hooray', 'rocket', 'eyes')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id, reaction_type)
);

-- Créer une table pour l'historique des assignations
CREATE TABLE public.task_assignments_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    previous_assignee UUID REFERENCES auth.users(id),
    assignment_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer une table pour les suggestions d'assignation automatique
CREATE TABLE public.task_assignment_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    suggested_assignee UUID NOT NULL REFERENCES auth.users(id),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    suggestion_reasons JSONB DEFAULT '[]'::jsonb,
    is_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Améliorer la table tasks pour un meilleur workflow
ALTER TABLE public.tasks 
ADD COLUMN labels JSONB DEFAULT '[]'::jsonb,
ADD COLUMN time_tracking JSONB DEFAULT '{}'::jsonb,
ADD COLUMN complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 5),
ADD COLUMN blocked_by UUID[] DEFAULT '{}',
ADD COLUMN blocking UUID[] DEFAULT '{}',
ADD COLUMN milestone_id UUID,
ADD COLUMN last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Créer des index pour les performances
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_parent ON task_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_task_comment_reactions_comment ON task_comment_reactions(comment_id);
CREATE INDEX idx_task_assignments_history_task ON task_assignments_history(task_id);
CREATE INDEX idx_task_assignment_suggestions_task ON task_assignment_suggestions(task_id);
CREATE INDEX idx_tasks_labels ON tasks USING GIN(labels);
CREATE INDEX idx_tasks_assignee_status ON tasks(assignee_id, status);
CREATE INDEX idx_tasks_last_activity ON tasks(last_activity_at DESC);

-- RLS pour les nouvelles tables
ALTER TABLE public.task_comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignment_suggestions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour task_comment_reactions
CREATE POLICY "Users can view reactions for accessible task comments"
ON public.task_comment_reactions FOR SELECT
USING (
    comment_id IN (
        SELECT tc.id FROM task_comments tc
        JOIN tasks t ON t.id = tc.task_id
        JOIN projects p ON p.id = t.project_id
        WHERE (
            auth.uid() IN (SELECT u.id FROM users u WHERE u.role = 'admin') OR
            auth.uid() = t.assignee_id OR
            auth.uid() = p.owner_id OR
            auth.uid() IN (SELECT u.id FROM users u WHERE u.role = 'client' AND u.company_id = p.client_company_id)
        )
    )
);

CREATE POLICY "Users can manage their own reactions"
ON public.task_comment_reactions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour task_assignments_history
CREATE POLICY "Users can view assignment history for accessible tasks"
ON public.task_assignments_history FOR SELECT
USING (
    task_id IN (
        SELECT t.id FROM tasks t
        JOIN projects p ON p.id = t.project_id
        WHERE (
            auth.uid() IN (SELECT u.id FROM users u WHERE u.role = 'admin') OR
            auth.uid() = t.assignee_id OR
            auth.uid() = p.owner_id OR
            auth.uid() IN (SELECT u.id FROM users u WHERE u.role = 'client' AND u.company_id = p.client_company_id)
        )
    )
);

CREATE POLICY "Authorized users can create assignment history"
ON public.task_assignments_history FOR INSERT
WITH CHECK (
    auth.uid() = assigned_by AND
    task_id IN (
        SELECT t.id FROM tasks t
        JOIN projects p ON p.id = t.project_id
        WHERE (
            auth.uid() IN (SELECT u.id FROM users u WHERE u.role = 'admin') OR
            auth.uid() = p.owner_id OR
            auth.uid() IN (SELECT u.id FROM users u WHERE u.role = 'client' AND u.company_id = p.client_company_id)
        )
    )
);

-- Politiques RLS pour task_assignment_suggestions
CREATE POLICY "Users can view assignment suggestions for accessible tasks"
ON public.task_assignment_suggestions FOR SELECT
USING (
    task_id IN (
        SELECT t.id FROM tasks t
        JOIN projects p ON p.id = t.project_id
        WHERE (
            auth.uid() IN (SELECT u.id FROM users u WHERE u.role = 'admin') OR
            auth.uid() = t.assignee_id OR
            auth.uid() = p.owner_id OR
            auth.uid() IN (SELECT u.id FROM users u WHERE u.role = 'client' AND u.company_id = p.client_company_id)
        )
    )
);

-- Fonction pour mettre à jour last_activity_at automatiquement
CREATE OR REPLACE FUNCTION update_task_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour l'activité des tâches
CREATE TRIGGER update_task_activity_trigger
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_task_activity();

-- Trigger pour créer un historique d'assignation
CREATE OR REPLACE FUNCTION track_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Seulement si l'assignee change
    IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
        INSERT INTO task_assignments_history (
            task_id, 
            assigned_by, 
            assigned_to, 
            previous_assignee,
            assignment_reason
        ) VALUES (
            NEW.id,
            auth.uid(),
            NEW.assignee_id,
            OLD.assignee_id,
            'Manual assignment change'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_task_assignment_trigger
    AFTER UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION track_task_assignment();