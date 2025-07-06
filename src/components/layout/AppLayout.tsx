
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';
import { GlobalVoiceAssistant } from '@/components/ai/GlobalVoiceAssistant';
import { useAuth } from '@/contexts/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 bg-background">
            {children}
          </main>
        </div>
        
        {/* Assistant vocal global */}
        <GlobalVoiceAssistant userId={user?.id} />
      </div>
    </SidebarProvider>
  );
}
