import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building2, Users, FileText, MessageSquare } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground mr-3">
              <Building2 className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-bold">Entreprise OS</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Plateforme SaaS complète pour la gestion d'entreprise moderne. 
            RH, Business et Support centralisés dans un seul outil.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/auth/login">Se connecter</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/auth/register">Créer un compte</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6 rounded-lg border bg-card">
            <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ressources Humaines</h3>
            <p className="text-muted-foreground">
              Gestion complète des employés, organigramme et analytics RH
            </p>
          </div>
          
          <div className="text-center p-6 rounded-lg border bg-card">
            <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Business</h3>
            <p className="text-muted-foreground">
              Devis, factures, clients et suivi commercial intégré
            </p>
          </div>
          
          <div className="text-center p-6 rounded-lg border bg-card">
            <MessageSquare className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Support</h3>
            <p className="text-muted-foreground">
              Tickets, SLA et base de connaissances centralisée
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
