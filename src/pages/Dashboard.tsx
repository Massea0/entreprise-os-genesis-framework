
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, FileText, MessageSquare, TrendingUp, Brain, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MetricCard } from '@/components/ui/MetricCard';
import { AIInsightsDashboard } from '@/components/ai/AIInsightsDashboard';
import { SynapseInsights } from '@/components/ai/SynapseInsights';
import { useState } from 'react';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ClientDashboard from '@/pages/client/ClientDashboard';
import EmployeeDashboard from '@/pages/employee/EmployeeDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const userRole = user?.user_metadata?.role || 'client';

  // Redirection vers les dashboards spécialisés selon le rôle
  if (userRole === 'admin' || userRole === 'super_admin') {
    return <AdminDashboard />;
  }
  
  if (userRole === 'client') {
    return <ClientDashboard />;
  }
  
  if (userRole === 'employee' || userRole === 'hr_manager' || userRole === 'hr_admin') {
    return <EmployeeDashboard />;
  }

  // Dashboard par défaut (ne devrait pas arriver)
  return <ClientDashboard />;
}
