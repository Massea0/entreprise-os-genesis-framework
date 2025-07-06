import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { SynapseInsights } from '@/components/ai/SynapseInsights';
import { 
  Search, 
  Filter, 
  Eye,
  FileText,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download
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
  notes?: string;
  rejection_reason?: string;
}

const QUOTE_STATUSES = [
  { value: 'draft', label: 'En préparation', color: 'bg-gray-500', icon: FileText },
  { value: 'sent', label: 'Reçu', color: 'bg-blue-500', icon: Clock },
  { value: 'approved', label: 'Accepté', color: 'bg-green-500', icon: CheckCircle },
  { value: 'rejected', label: 'Refusé', color: 'bg-red-500', icon: XCircle },
  { value: 'expired', label: 'Expiré', color: 'bg-orange-500', icon: AlertTriangle }
];

export default function ClientQuotes() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const userCompanyId = user?.user_metadata?.company_id;
      if (!userCompanyId) return;

      const { data, error } = await supabase
        .from('devis')
        .select('*')
        .eq('company_id', userCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error('Error loading quotes:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors du chargement de vos devis"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteDecision = async (quoteId: string, decision: 'approved' | 'rejected') => {
    try {
      setIsProcessing(true);
      
      const updateData = {
        status: decision,
        validated_at: new Date().toISOString(),
        ...(decision === 'rejected' && rejectionReason ? { rejection_reason: rejectionReason } : {})
      };

      const { error } = await supabase
        .from('devis')
        .update(updateData)
        .eq('id', quoteId);

      if (error) throw error;
      
      toast({
        title: decision === 'approved' ? "Devis accepté" : "Devis refusé",
        description: decision === 'approved' 
          ? "Nous procédons au démarrage du projet" 
          : "Votre réponse a été enregistrée"
      });
      
      setSelectedQuote(null);
      setRejectionReason('');
      loadQuotes();
    } catch (error) {
      console.error('Error updating quote:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de traiter votre réponse"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.object.toLowerCase().includes(searchTerm.toLowerCase());
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

  const getClientStats = () => {
    const total = quotes.reduce((sum, q) => sum + q.amount, 0);
    const pending = quotes.filter(q => q.status === 'sent').length;
    const approved = quotes.filter(q => q.status === 'approved').reduce((sum, q) => sum + q.amount, 0);
    const expired = quotes.filter(q => q.status === 'expired' || (q.status === 'sent' && new Date(q.valid_until) < new Date())).length;
    
    return { total, pending, approved, expired };
  };

  const stats = getClientStats();

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
          <h1 className="text-3xl font-bold">Mes Devis</h1>
          <p className="text-muted-foreground">
            Consultez et gérez vos propositions commerciales
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Télécharger PDF
        </Button>
      </div>

      {/* Synapse Insights */}
      <SynapseInsights context="client-quotes" />

      {/* Client Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
            <p className="text-xs text-muted-foreground">
              {quotes.length} devis reçus
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Réponse attendue
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets Validés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.approved)}</div>
            <p className="text-xs text-muted-foreground">
              Montant approuvé
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgence</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">
              Expirent bientôt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Recherche</CardTitle>
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

      {/* Quotes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vos Propositions Commerciales</CardTitle>
          <CardDescription>
            {filteredQuotes.length} devis trouvé{filteredQuotes.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Validité</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.map((quote) => {
                const statusConfig = getStatusConfig(quote.status);
                const StatusIcon = statusConfig.icon;
                const isExpired = new Date(quote.valid_until) < new Date();
                const canRespond = quote.status === 'sent' && !isExpired;
                
                return (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.number}</TableCell>
                    <TableCell>{quote.object}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(quote.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-2">
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
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
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canRespond && (
                          <>
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleQuoteDecision(quote.id, 'approved')}
                              disabled={isProcessing}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accepter
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => setSelectedQuote(quote)}
                              disabled={isProcessing}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Refuser
                            </Button>
                          </>
                        )}
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

      {/* Rejection Modal */}
      {selectedQuote && (
        <Card className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full m-4">
            <h3 className="text-lg font-semibold mb-4">Refuser le devis</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Devis: {selectedQuote.object} - {formatCurrency(selectedQuote.amount)}
            </p>
            <Textarea
              placeholder="Motif du refus (optionnel)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSelectedQuote(null)}>
                Annuler
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleQuoteDecision(selectedQuote.id, 'rejected')}
                disabled={isProcessing}
              >
                Confirmer le refus
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}