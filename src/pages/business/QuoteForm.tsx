import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2,
  Calculator
} from 'lucide-react';

interface QuoteItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Company {
  id: string;
  name: string;
  email: string;
}

export default function QuoteForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = id !== 'new';
  
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState({
    number: '',
    object: '',
    company_id: '',
    amount: 0,
    valid_until: '',
    notes: '',
    status: 'draft'
  });
  const [items, setItems] = useState<QuoteItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0 }
  ]);
  
  const { toast } = useToast();

  useEffect(() => {
    loadCompanies();
    if (isEdit) {
      loadQuote();
    } else {
      generateQuoteNumber();
    }
  }, [id]);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, email')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const generateQuoteNumber = async () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const number = `DEV-${year}${month}-${random}`;
    
    setForm(prev => ({ ...prev, number }));
  };

  const loadQuote = async () => {
    try {
      setLoading(true);
      
      const [quoteResponse, itemsResponse] = await Promise.all([
        supabase
          .from('devis')
          .select('*')
          .eq('id', id)
          .single(),
        supabase
          .from('devis_items')
          .select('*')
          .eq('devis_id', id)
          .order('id')
      ]);

      if (quoteResponse.error) throw quoteResponse.error;
      
      const quote = quoteResponse.data;
      setForm({
        number: quote.number,
        object: quote.object,
        company_id: quote.company_id,
        amount: quote.amount,
        valid_until: quote.valid_until ? quote.valid_until.split('T')[0] : '',
        notes: quote.notes || '',
        status: quote.status
      });

      if (itemsResponse.data && itemsResponse.data.length > 0) {
        setItems(itemsResponse.data);
      }
    } catch (error) {
      console.error('Error loading quote:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors du chargement du devis"
      });
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate total for this item
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setItems(newItems);
    
    // Update total amount
    const totalAmount = newItems.reduce((sum, item) => sum + item.total, 0);
    setForm(prev => ({ ...prev, amount: totalAmount }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.company_id || !form.object || items.some(item => !item.description)) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires"
      });
      return;
    }

    try {
      setLoading(true);

      if (isEdit) {
        // Update existing quote
        const { error: quoteError } = await supabase
          .from('devis')
          .update({
            object: form.object,
            company_id: form.company_id,
            amount: form.amount,
            valid_until: form.valid_until,
            notes: form.notes,
            status: form.status
          })
          .eq('id', id);

        if (quoteError) throw quoteError;

        // Delete existing items and recreate them
        await supabase.from('devis_items').delete().eq('devis_id', id);
        
        const itemsToInsert = items.map(item => ({
          devis_id: id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total
        }));

        const { error: itemsError } = await supabase
          .from('devis_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      } else {
        // Create new quote
        const { data: quoteData, error: quoteError } = await supabase
          .from('devis')
          .insert([{
            number: form.number,
            object: form.object,
            company_id: form.company_id,
            amount: form.amount,
            valid_until: form.valid_until,
            notes: form.notes,
            status: form.status
          }])
          .select()
          .single();

        if (quoteError) throw quoteError;

        // Insert items
        const itemsToInsert = items.map(item => ({
          devis_id: quoteData.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total
        }));

        const { error: itemsError } = await supabase
          .from('devis_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      toast({
        title: "Succès",
        description: `Devis ${isEdit ? 'mis à jour' : 'créé'} avec succès`
      });

      navigate('/business/quotes');
    } catch (error) {
      console.error('Error saving quote:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Erreur lors de ${isEdit ? 'la mise à jour' : 'la création'} du devis`
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/business/quotes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? 'Modifier le devis' : 'Nouveau devis'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? 'Modifiez les informations du devis' : 'Créez un nouveau devis'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="number">Numéro de devis *</Label>
                <Input
                  id="number"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  required
                  disabled={isEdit}
                />
              </div>
              <div>
                <Label htmlFor="company">Client *</Label>
                <Select
                  value={form.company_id}
                  onValueChange={(value) => setForm({ ...form, company_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="object">Objet du devis *</Label>
              <Input
                id="object"
                value={form.object}
                onChange={(e) => setForm({ ...form, object: e.target.value })}
                required
                placeholder="Ex: Développement application web"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valid_until">Valide jusqu'au</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="sent">Envoyé</SelectItem>
                    <SelectItem value="approved">Approuvé</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes internes..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Articles</CardTitle>
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un article
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Prix unitaire</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Description de l'article"
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.total)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Separator className="my-4" />
            
            <div className="flex justify-end">
              <div className="text-right space-y-2">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  <span className="font-medium">Total: </span>
                  <span className="text-2xl font-bold">{formatCurrency(form.amount)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link to="/business/quotes">
            <Button type="button" variant="outline">
              Annuler
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </div>
  );
}