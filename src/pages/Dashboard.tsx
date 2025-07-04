import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, MessageSquare, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const userRole = user?.user_metadata?.role || 'client';

  const stats = [
    {
      title: "Employés Actifs",
      value: "8",
      description: "Personnel en service",
      icon: Users,
      color: "text-blue-600",
      roles: ['admin', 'hr_manager']
    },
    {
      title: "Factures en Attente",
      value: "12",
      description: "À traiter ce mois",
      icon: FileText,
      color: "text-green-600",
      roles: ['admin', 'client']
    },
    {
      title: "Tickets Ouverts",
      value: "3",
      description: "Support en cours",
      icon: MessageSquare,
      color: "text-orange-600",
      roles: ['admin', 'hr_manager', 'client']
    },
    {
      title: "Performance",
      value: "94%",
      description: "Score global équipe",
      icon: TrendingUp,
      color: "text-purple-600",
      roles: ['admin', 'hr_manager']
    }
  ];

  const filteredStats = stats.filter(stat => stat.roles.includes(userRole));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Bienvenue dans votre plateforme de gestion Arcadis Technologies
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
            <CardDescription>
              Dernières actions dans votre espace de travail
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Nouvel employé ajouté</p>
                <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
              </div>
              <Badge variant="secondary">RH</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Facture générée</p>
                <p className="text-xs text-muted-foreground">Il y a 4 heures</p>
              </div>
              <Badge variant="secondary">Business</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Ticket support résolu</p>
                <p className="text-xs text-muted-foreground">Il y a 6 heures</p>
              </div>
              <Badge variant="secondary">Support</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>
              Raccourcis pour vos tâches fréquentes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {userRole === 'admin' || userRole === 'hr_manager' ? (
              <div className="grid grid-cols-2 gap-3">
                <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                  <Users className="h-5 w-5 mb-2 text-blue-600" />
                  <div className="text-sm font-medium">Ajouter Employé</div>
                </button>
                <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                  <FileText className="h-5 w-5 mb-2 text-green-600" />
                  <div className="text-sm font-medium">Nouveau Rapport</div>
                </button>
              </div>
            ) : null}
            
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                <MessageSquare className="h-5 w-5 mb-2 text-orange-600" />
                <div className="text-sm font-medium">Créer Ticket</div>
              </button>
              <button className="p-3 border rounded-lg hover:bg-accent transition-colors text-left">
                <TrendingUp className="h-5 w-5 mb-2 text-purple-600" />
                <div className="text-sm font-medium">Voir Analytics</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}