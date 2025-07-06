import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye,
  Edit,
  FileText,
  Calendar,
  DollarSign,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import AdminQuotes from './AdminQuotes';
import ClientQuotes from './ClientQuotes';

interface Quote {
  id: string;
  number: string;
  object: string;
  amount: number;
  status: string;
  valid_until: string;
  validated_at?: string;
  created_at: string;
  company_id: string;
  company?: { name: string };
  notes?: string;
  rejection_reason?: string;
}

const QUOTE_STATUSES = [
  { value: 'draft', label: 'Brouillon', color: 'bg-gray-500' },
  { value: 'sent', label: 'Envoyé', color: 'bg-blue-500' },
  { value: 'approved', label: 'Approuvé', color: 'bg-green-500' },
  { value: 'rejected', label: 'Rejeté', color: 'bg-red-500' },
  { value: 'expired', label: 'Expiré', color: 'bg-orange-500' }
];

export default function Quotes() {
  const { user } = useAuth();
  const userRole = user?.user_metadata?.role || 'client';

  // Redirection vers la vue appropriée selon le rôle
  if (userRole === 'admin' || userRole === 'super_admin') {
    return <AdminQuotes />;
  }
  
  return <ClientQuotes />;
}