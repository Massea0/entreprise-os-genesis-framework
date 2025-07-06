import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAIContext } from '@/components/ai/AIContextProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Bell, Palette, Globe, Key, Database } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Settings() {
  const { user } = useAuth();
  const { contextualSuggestions } = useAIContext();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const userRole = user?.user_metadata?.role || 'client';
  const userEmail = user?.email || '';

  const handleSaveProfile = () => {
    toast({
      title: "Profil mis à jour",
      description: "Vos paramètres ont été sauvegardés avec succès.",
    });
  };

  const handleChangePassword = () => {
    toast({
      title: "Changement de mot de passe",
      description: "Un email de réinitialisation vous a été envoyé.",
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground">
            Gérez vos préférences et paramètres de compte
          </p>
        </div>
        <Badge variant="outline" className="capitalize">
          {userRole}
        </Badge>
      </div>

      {/* Synapse Insights */}
      {contextualSuggestions.length > 0 && (
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🧠 Synapse - Suggestions de configuration
            </CardTitle>
            <CardDescription>
              Recommandations personnalisées pour optimiser votre expérience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {contextualSuggestions.slice(0, 3).map((suggestion, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <span>{suggestion.icon}</span>
                    <span className="text-sm">{suggestion.text}</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Appliquer
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Préférences
          </TabsTrigger>
          {userRole === 'admin' && (
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Administration
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Mettez à jour vos informations de profil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={userEmail} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Input id="role" value={userRole} disabled />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input id="name" placeholder="Votre nom complet" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company">Entreprise</Label>
                <Input id="company" placeholder="Nom de votre entreprise" />
              </div>

              <Button onClick={handleSaveProfile}>
                Sauvegarder les modifications
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sécurité du compte</CardTitle>
              <CardDescription>
                Gérez la sécurité de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mot de passe</Label>
                  <p className="text-sm text-muted-foreground">
                    Dernière modification il y a 30 jours
                  </p>
                </div>
                <Button variant="outline" onClick={handleChangePassword}>
                  <Key className="h-4 w-4 mr-2" />
                  Changer le mot de passe
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Authentification à deux facteurs</Label>
                  <p className="text-sm text-muted-foreground">
                    Ajoutez une couche de sécurité supplémentaire
                  </p>
                </div>
                <Button variant="outline">
                  Configurer 2FA
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Sessions actives</Label>
                  <p className="text-sm text-muted-foreground">
                    Gérez vos sessions de connexion
                  </p>
                </div>
                <Button variant="outline">
                  Voir les sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Préférences d'interface</CardTitle>
              <CardDescription>
                Personnalisez votre expérience utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <div>
                    <Label>Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des notifications push
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <div>
                    <Label>Mode sombre</Label>
                    <p className="text-sm text-muted-foreground">
                      Utiliser le thème sombre
                    </p>
                  </div>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <div>
                    <Label>Langue</Label>
                    <p className="text-sm text-muted-foreground">
                      Choisissez votre langue préférée
                    </p>
                  </div>
                </div>
                <Button variant="outline">
                  Français
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {userRole === 'admin' && (
          <TabsContent value="admin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres d'administration</CardTitle>
                <CardDescription>
                  Configuration système et gestion avancée
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex-col">
                    <Database className="h-6 w-6 mb-2" />
                    Gestion Base de Données
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Shield className="h-6 w-6 mb-2" />
                    Sécurité Système
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <User className="h-6 w-6 mb-2" />
                    Gestion Utilisateurs
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Globe className="h-6 w-6 mb-2" />
                    Configuration Globale
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Maintenance Système</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Nettoyer Cache
                    </Button>
                    <Button variant="outline" size="sm">
                      Exporter Logs
                    </Button>
                    <Button variant="outline" size="sm">
                      Backup BD
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}