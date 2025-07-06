
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, User, Settings, Eye, Edit, Trash2, Plus } from 'lucide-react';

interface Permission {
  id: string;
  module: string;
  action: string; // 'read', 'write', 'delete', 'admin'
  description: string;
}

interface UserPermission {
  userId: string;
  userName: string;
  userRole: string;
  permissions: Permission[];
}

const MODULES = [
  { id: 'hr', name: 'Ressources Humaines', icon: '👥' },
  { id: 'projects', name: 'Projets', icon: '📋' },
  { id: 'business', name: 'Business', icon: '💼' },
  { id: 'finance', name: 'Finance', icon: '💰' },
  { id: 'support', name: 'Support Client', icon: '🎧' },
  { id: 'admin', name: 'Administration', icon: '⚙️' },
  { id: 'analytics', name: 'Analytics', icon: '📊' },
  { id: 'ai', name: 'IA & Insights', icon: '🤖' }
];

const ACTIONS = [
  { id: 'read', name: 'Lecture', icon: Eye, color: 'blue' },
  { id: 'write', name: 'Écriture', icon: Edit, color: 'green' },
  { id: 'delete', name: 'Suppression', icon: Trash2, color: 'red' },
  { id: 'admin', name: 'Administration', icon: Settings, color: 'purple' }
];

export const PermissionsManager: React.FC = () => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<any[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadEmployees();
    loadPermissions();
  }, []);

  const loadEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('id, first_name, last_name, user_id, positions(title)')
      .eq('employment_status', 'active');

    if (!error && data) {
      setEmployees(data);
    }
  };

  const loadPermissions = async () => {
    // Pour l'instant, on simule les permissions
    // Dans une vraie implémentation, elles seraient stockées en base
    const mockPermissions: UserPermission[] = employees.map(emp => ({
      userId: emp.user_id || emp.id,
      userName: `${emp.first_name} ${emp.last_name}`,
      userRole: emp.positions?.title || 'Employé',
      permissions: getDefaultPermissions(emp.positions?.title || 'employee')
    }));
    
    setUserPermissions(mockPermissions);
  };

  const getDefaultPermissions = (role: string): Permission[] => {
    const allPermissions: Permission[] = [];
    
    MODULES.forEach(module => {
      ACTIONS.forEach(action => {
        // Logique de permissions par défaut selon le rôle
        let hasPermission = false;
        
        if (role.toLowerCase().includes('admin') || role.toLowerCase().includes('directeur')) {
          hasPermission = true; // Admin a tout
        } else if (role.toLowerCase().includes('manager') || role.toLowerCase().includes('chef')) {
          hasPermission = action.id !== 'admin'; // Manager tout sauf admin
        } else if (module.id === 'hr' && role.toLowerCase().includes('rh')) {
          hasPermission = true; // RH a accès total au module RH
        } else if (module.id === 'projects') {
          hasPermission = ['read', 'write'].includes(action.id); // Tous peuvent voir/modifier les projets
        } else if (['read'].includes(action.id)) {
          hasPermission = true; // Lecture pour tous par défaut
        }
        
        if (hasPermission) {
          allPermissions.push({
            id: `${module.id}_${action.id}`,
            module: module.id,
            action: action.id,
            description: `${action.name} - ${module.name}`
          });
        }
      });
    });
    
    return allPermissions;
  };

  const updateUserPermissions = async (userId: string, permissions: Permission[]) => {
    setIsLoading(true);
    
    try {
      // Ici on sauvegarderait en base de données
      // Pour l'instant on met juste à jour l'état local
      setUserPermissions(prev => 
        prev.map(up => 
          up.userId === userId 
            ? { ...up, permissions }
            : up
        )
      );
      
      toast({
        title: "Permissions mises à jour",
        description: "Les permissions de l'utilisateur ont été sauvegardées"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour les permissions"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePermission = (userId: string, moduleId: string, actionId: string) => {
    const userPerm = userPermissions.find(up => up.userId === userId);
    if (!userPerm) return;

    const permissionId = `${moduleId}_${actionId}`;
    const hasPermission = userPerm.permissions.some(p => p.id === permissionId);
    
    let newPermissions;
    if (hasPermission) {
      // Retirer la permission
      newPermissions = userPerm.permissions.filter(p => p.id !== permissionId);
    } else {
      // Ajouter la permission
      const module = MODULES.find(m => m.id === moduleId);
      const action = ACTIONS.find(a => a.id === actionId);
      
      newPermissions = [...userPerm.permissions, {
        id: permissionId,
        module: moduleId,
        action: actionId,
        description: `${action?.name} - ${module?.name}`
      }];
    }
    
    updateUserPermissions(userId, newPermissions);
  };

  const selectedUserData = userPermissions.find(up => up.userId === selectedUser);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Gestion des Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.user_id || emp.id} value={emp.user_id || emp.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {emp.first_name} {emp.last_name}
                        <Badge variant="outline" className="ml-2">
                          {emp.positions?.title || 'Employé'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedUserData && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedUserData.permissions.length} permissions
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Matrice des permissions */}
      {selectedUserData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Permissions de {selectedUserData.userName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {MODULES.map(module => (
                <div key={module.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">{module.icon}</span>
                    <h3 className="font-semibold">{module.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {ACTIONS.map(action => {
                      const permissionId = `${module.id}_${action.id}`;
                      const hasPermission = selectedUserData.permissions.some(
                        p => p.id === permissionId
                      );
                      const IconComponent = action.icon;
                      
                      return (
                        <div
                          key={action.id}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                            hasPermission 
                              ? 'bg-primary/10 border-primary/30' 
                              : 'bg-muted/30 border-muted'
                          }`}
                          onClick={() => togglePermission(selectedUser, module.id, action.id)}
                        >
                          <Checkbox 
                            checked={hasPermission}
                            onChange={() => {}}
                          />
                          <IconComponent className={`h-4 w-4 text-${action.color}-600`} />
                          <span className="text-sm font-medium">{action.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Sauvegarder les permissions
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Vue d'ensemble */}
      <Card>
        <CardHeader>
          <CardTitle>Vue d'ensemble des permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userPermissions.map((userPerm) => (
              <div key={userPerm.userId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{userPerm.userName}</div>
                    <div className="text-sm text-muted-foreground">{userPerm.userRole}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {userPerm.permissions.length} permissions
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUser(userPerm.userId)}
                  >
                    Modifier
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
