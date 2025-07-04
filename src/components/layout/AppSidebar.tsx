import { 
  Building2, 
  Users, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  Settings,
  Home
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    roles: ['admin', 'hr_manager', 'client'],
  },
  {
    title: "IA - Organisation",
    url: "/work-dashboard",
    icon: BarChart3,
    roles: ['admin', 'hr_manager'],
  },
  {
    title: "Ressources Humaines",
    icon: Users,
    roles: ['admin', 'hr_manager'],
    submenu: [
      { title: "Employés", url: "/hr/employees", icon: Users },
      { title: "Départements", url: "/hr/departments", icon: Building2 },
      { title: "Organigramme", url: "/hr/organization", icon: BarChart3 },
    ]
  },
  {
    title: "Business",
    icon: FileText,
    roles: ['admin', 'client'],
    submenu: [
      { title: "Devis", url: "/business/quotes", icon: FileText },
      { title: "Factures", url: "/business/invoices", icon: FileText },
      { title: "Clients", url: "/business/clients", icon: Building2 },
    ]
  },
  {
    title: "Support",
    icon: MessageSquare,
    roles: ['admin', 'hr_manager', 'client'],
    submenu: [
      { title: "Tickets", url: "/support/tickets", icon: MessageSquare },
      { title: "Base de connaissances", url: "/support/knowledge", icon: FileText },
    ]
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  
  const currentPath = location.pathname;
  const userRole = user?.user_metadata?.role || 'client';
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavClass = (isActive: boolean) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "";

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <img 
            src="/arcadis-logo.svg" 
            alt="Arcadis Technologies" 
            className="h-8 w-8" 
          />
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold">Arcadis Entreprise OS</p>
              <p className="text-xs text-muted-foreground">by Arcadis Technologies</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {filteredMenuItems.map((item) => (
          <SidebarGroup key={item.title}>
            {item.submenu ? (
              <>
                <SidebarGroupLabel className="text-xs text-muted-foreground">
                  {item.title}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {item.submenu.map((subItem) => (
                      <SidebarMenuItem key={subItem.title}>
                        <SidebarMenuButton asChild>
                          <NavLink 
                            to={subItem.url} 
                            className={getNavClass(isActive(subItem.url))}
                          >
                            <subItem.icon className="h-4 w-4" />
                            {!collapsed && <span>{subItem.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </>
            ) : (
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={getNavClass(isActive(item.url))}
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        ))}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/settings" 
                    className={getNavClass(isActive('/settings'))}
                  >
                    <Settings className="h-4 w-4" />
                    {!collapsed && <span>Paramètres</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        {!collapsed && user && (
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">{user.email}</p>
            <p className="capitalize">{userRole}</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}