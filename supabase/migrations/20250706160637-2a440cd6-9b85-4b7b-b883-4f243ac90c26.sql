-- Extension des tables de support avec IA et analyse des sentiments

-- Table pour l'analyse des sentiments des messages
CREATE TABLE IF NOT EXISTS public.ticket_sentiment_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.ticket_messages(id) ON DELETE CASCADE,
  sentiment_score DECIMAL(3,2) NOT NULL CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  sentiment_label TEXT NOT NULL CHECK (sentiment_label IN ('positive', 'neutral', 'negative', 'very_negative')),
  emotions JSONB DEFAULT '{}',
  urgency_level INTEGER NOT NULL CHECK (urgency_level >= 1 AND urgency_level <= 5),
  confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0.0,
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les réponses automatiques de l'IA
CREATE TABLE IF NOT EXISTS public.ai_support_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  response_type TEXT NOT NULL CHECK (response_type IN ('acknowledgment', 'automated_solution', 'escalation_notice', 'status_update')),
  content TEXT NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0.0,
  is_sent BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  generated_by TEXT NOT NULL DEFAULT 'ai_assistant',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour le suivi des agents de support
CREATE TABLE IF NOT EXISTS public.support_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  specializations TEXT[] DEFAULT '{}',
  max_concurrent_tickets INTEGER NOT NULL DEFAULT 10,
  current_active_tickets INTEGER NOT NULL DEFAULT 0,
  availability_status TEXT NOT NULL DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'offline')),
  average_response_time INTERVAL,
  total_tickets_handled INTEGER NOT NULL DEFAULT 0,
  satisfaction_rating DECIMAL(3,2) DEFAULT 0.0,
  is_ai_assisted BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Table pour les notifications du système de support
CREATE TABLE IF NOT EXISTS public.support_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('new_ticket', 'urgent_escalation', 'sentiment_alert', 'ai_intervention_needed', 'auto_response_sent')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_role TEXT NOT NULL CHECK (recipient_role IN ('admin', 'agent', 'manager')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Modification de la table tickets pour ajouter des champs IA
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS ai_confidence_score DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS auto_categorized BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sentiment_trend JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_sentiment_analysis TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS escalation_reason TEXT,
ADD COLUMN IF NOT EXISTS resolution_suggestions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS estimated_resolution_time INTERVAL;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_tickets_sentiment_analysis_ticket_id ON public.ticket_sentiment_analysis(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_sentiment_analysis_urgency ON public.ticket_sentiment_analysis(urgency_level DESC);
CREATE INDEX IF NOT EXISTS idx_ai_support_responses_ticket_id ON public.ai_support_responses(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_notifications_recipient ON public.support_notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_support_notifications_severity ON public.support_notifications(severity, created_at DESC);

-- Fonction pour calculer l'urgence basée sur le sentiment
CREATE OR REPLACE FUNCTION public.calculate_urgency_from_sentiment(
  p_sentiment_score DECIMAL,
  p_sentiment_label TEXT,
  p_ticket_priority TEXT DEFAULT 'medium'
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  base_urgency INTEGER;
  sentiment_multiplier DECIMAL;
BEGIN
  -- Base d'urgence selon la priorité du ticket
  CASE p_ticket_priority
    WHEN 'low' THEN base_urgency := 1;
    WHEN 'medium' THEN base_urgency := 2;
    WHEN 'high' THEN base_urgency := 3;
    WHEN 'urgent' THEN base_urgency := 4;
    ELSE base_urgency := 2;
  END CASE;
  
  -- Multiplicateur basé sur le sentiment
  CASE p_sentiment_label
    WHEN 'very_negative' THEN sentiment_multiplier := 2.0;
    WHEN 'negative' THEN sentiment_multiplier := 1.5;
    WHEN 'neutral' THEN sentiment_multiplier := 1.0;
    WHEN 'positive' THEN sentiment_multiplier := 0.8;
    ELSE sentiment_multiplier := 1.0;
  END CASE;
  
  -- Calcul final avec plafond à 5
  RETURN LEAST(5, GREATEST(1, ROUND(base_urgency * sentiment_multiplier)));
END;
$$;

-- Trigger pour mettre à jour automatiquement l'urgence après analyse des sentiments
CREATE OR REPLACE FUNCTION public.update_ticket_urgency_from_sentiment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  ticket_priority TEXT;
  new_urgency INTEGER;
BEGIN
  -- Récupérer la priorité actuelle du ticket
  SELECT priority INTO ticket_priority 
  FROM public.tickets 
  WHERE id = NEW.ticket_id;
  
  -- Calculer la nouvelle urgence
  new_urgency := public.calculate_urgency_from_sentiment(
    NEW.sentiment_score,
    NEW.sentiment_label,
    ticket_priority
  );
  
  -- Mettre à jour le ticket avec la nouvelle urgence si elle est plus élevée
  UPDATE public.tickets
  SET 
    last_sentiment_analysis = now(),
    sentiment_trend = COALESCE(sentiment_trend, '{}'::jsonb) || 
                     jsonb_build_object(
                       to_char(now(), 'YYYY-MM-DD HH24:MI:SS'), 
                       jsonb_build_object(
                         'sentiment', NEW.sentiment_label,
                         'score', NEW.sentiment_score,
                         'urgency', new_urgency
                       )
                     )
  WHERE id = NEW.ticket_id;
  
  -- Créer une notification si l'urgence est critique
  IF new_urgency >= 4 THEN
    INSERT INTO public.support_notifications (
      ticket_id,
      notification_type,
      title,
      message,
      recipient_role,
      severity,
      data
    ) VALUES (
      NEW.ticket_id,
      'sentiment_alert',
      'Ticket à sentiment très négatif détecté',
      'Le ticket #' || (SELECT number FROM public.tickets WHERE id = NEW.ticket_id) || 
      ' présente un sentiment ' || NEW.sentiment_label || ' avec un score de ' || NEW.sentiment_score,
      'manager',
      CASE WHEN new_urgency = 5 THEN 'critical' ELSE 'high' END,
      jsonb_build_object(
        'sentiment_score', NEW.sentiment_score,
        'sentiment_label', NEW.sentiment_label,
        'urgency_level', new_urgency
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_ticket_urgency_from_sentiment ON public.ticket_sentiment_analysis;
CREATE TRIGGER trigger_update_ticket_urgency_from_sentiment
AFTER INSERT ON public.ticket_sentiment_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_ticket_urgency_from_sentiment();

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_support_agents_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_support_agents_updated_at ON public.support_agents;
CREATE TRIGGER trigger_update_support_agents_updated_at
BEFORE UPDATE ON public.support_agents
FOR EACH ROW
EXECUTE FUNCTION public.update_support_agents_updated_at();

-- Politiques RLS
ALTER TABLE public.ticket_sentiment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_support_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_notifications ENABLE ROW LEVEL SECURITY;

-- Politiques pour ticket_sentiment_analysis
CREATE POLICY "Support agents can view sentiment analysis" ON public.ticket_sentiment_analysis
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.support_agents sa 
  WHERE sa.user_id = auth.uid()
) OR EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
));

-- Politiques pour ai_support_responses
CREATE POLICY "Support agents can manage AI responses" ON public.ai_support_responses
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.support_agents sa 
  WHERE sa.user_id = auth.uid()
) OR EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.id = auth.uid() AND u.role IN ('admin', 'support_manager')
));

-- Politiques pour support_agents
CREATE POLICY "Support agents can view their own profile" ON public.support_agents
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.id = auth.uid() AND u.role IN ('admin', 'support_manager')
));

CREATE POLICY "Admins can manage support agents" ON public.support_agents
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.id = auth.uid() AND u.role IN ('admin', 'support_manager')
));

-- Politiques pour support_notifications
CREATE POLICY "Users can view their notifications" ON public.support_notifications
FOR SELECT TO authenticated
USING (recipient_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.id = auth.uid() AND u.role IN ('admin', 'support_manager')
));

CREATE POLICY "Support system can create notifications" ON public.support_notifications
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.id = auth.uid() AND u.role IN ('admin', 'support_manager', 'support_agent')
) OR EXISTS (
  SELECT 1 FROM public.support_agents sa 
  WHERE sa.user_id = auth.uid()
));

CREATE POLICY "Users can update their own notifications" ON public.support_notifications
FOR UPDATE TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());