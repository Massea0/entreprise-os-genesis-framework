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
import { SynapseInsights } from '@/components/ai/SynapseInsights';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye,
  Edit,
  FileText,
  Calendar,
  DollarSign,
  Building2,
  Download,
  Send,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('devis')
        .select(`
          *,
          company:company_id(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error('Error loading quotes:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors du chargement des devis"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuoteStatus = async (quoteId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('devis')
        .update({ status: newStatus })
        .eq('id', quoteId);

      if (error) throw error;
      
      toast({
        title: "Statut mis à jour",
        description: "Le statut du devis a été modifié avec succès"
      });
      
      loadQuotes();
    } catch (error) {
      console.error('Error updating quote status:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le statut"
      });
    }
  };

  const deleteQuote = async (quoteId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) return;
    
    try {
      const { error } = await supabase
        .from('devis')
        .delete()
        .eq('id', quoteId);
      
      if (error) throw error;
      
      toast({
        title: "Devis supprimé",
        description: "Le devis a été supprimé avec succès"
      });
      
      loadQuotes();
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le devis"
      });
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.object.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.company?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status: string) => {
    return QUOTE_STATUSES.find(s => s.value === status) || QUOTE_STATUSES[0];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getQuoteStats = () => {
    const total = quotes.reduce((sum, q) => sum + q.amount, 0);
    const approved = quotes.filter(q => q.status === 'approved').reduce((sum, q) => sum + q.amount, 0);
    const pending = quotes.filter(q => q.status === 'sent').length;
    const conversionRate = quotes.length > 0 ? (quotes.filter(q => q.status === 'approved').length / quotes.length * 100) : 0;
    
    return { total, approved, pending, conversionRate };
  };

  const stats = getQuoteStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Devis (Admin)</h1>
          <p className="text-muted-foreground">
            Administration complète des devis - Contrôle total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Link to="/business/quotes/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau devis
            </Button>
          </Link>
        </div>
      </div>

      {/* Synapse Insights */}
      <SynapseInsights context="admin-quotes" />

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
            <p className="text-xs text-muted-foreground">
              {quotes.length} devis au total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre Signé</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.approved)}</div>
            <p className="text-xs text-muted-foreground">
              Devis approuvés
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Réponse client attendue
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux Conversion</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Performance commerciale
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres & Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un devis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {QUOTE_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Quotes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Devis (Vue Admin)</CardTitle>
          <CardDescription>
            {filteredQuotes.length} devis trouvé{filteredQuotes.length > 1 ? 's' : ''} - Contrôles administrateur disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Validité</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions Admin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.map((quote) => {
                const statusConfig = getStatusConfig(quote.status);
                const isExpired = new Date(quote.valid_until) < new Date();
                
                return (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.number}</TableCell>
                    <TableCell>{quote.object}</TableCell>
                    <TableCell>{quote.company?.name || 'N/A'}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(quote.amount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
                          {statusConfig.label}
                        </Badge>
                        {quote.status === 'sent' && (
                          <Select onValueChange={(value) => updateQuoteStatus(quote.id, value)}>
                            <SelectTrigger className="w-20 h-6">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="approved">Approuver</SelectItem>
                              <SelectItem value="rejected">Rejeter</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={isExpired ? 'text-red-600 font-medium' : ''}>
                        {format(new Date(quote.valid_until), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </TableCell>
                    <TableCell>
                      {format(new Date(quote.created_at), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link to={`/business/quotes/${quote.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Link to={`/business/quotes/${quote.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm">
                          <Send className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteQuote(quote.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredQuotes.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun devis trouvé</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}