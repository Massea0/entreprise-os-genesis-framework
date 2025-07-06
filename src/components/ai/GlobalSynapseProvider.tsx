import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SynapseInsights } from './SynapseInsights';
import { Button } from '@/components/ui/button';
import { Brain, Minimize2, Maximize2 } from 'lucide-react';

interface SynapseContextType {
  isVisible: boolean;
  isCompact: boolean;
  context: string;
  toggleVisibility: () => void;
  toggleCompact: () => void;
  setContext: (context: string) => void;
}

const SynapseContext = createContext<SynapseContextType | undefined>(undefined);

export const useSynapse = () => {
  const context = useContext(SynapseContext);
  if (!context) {
    throw new Error('useSynapse must be used within a SynapseProvider');
  }
  return context;
};

interface SynapseProviderProps {
  children: React.ReactNode;
}

export const GlobalSynapseProvider: React.FC<SynapseProviderProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isCompact, setIsCompact] = useState(false);
  const [context, setContext] = useState('global');
  const location = useLocation();

  // Déterminer le contexte automatiquement basé sur l'URL
  useEffect(() => {
    const path = location.pathname;
    
    if (path.includes('/dashboard')) {
      setContext('dashboard');
    } else if (path.includes('/projects')) {
      setContext('projects');
    } else if (path.includes('/hr')) {
      setContext('hr');
    } else if (path.includes('/support')) {
      setContext('support');
    } else if (path.includes('/business')) {
      setContext('business');
    } else {
      setContext('global');
    }
  }, [location.pathname]);

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleCompact = () => setIsCompact(!isCompact);

  const value = {
    isVisible,
    isCompact,
    context,
    toggleVisibility,
    toggleCompact,
    setContext
  };

  return (
    <SynapseContext.Provider value={value}>
      {children}
      
      {/* Floating Synapse Button - Always visible */}
      <div className="fixed bottom-6 right-6 z-50">
        {isVisible ? (
          <div className="space-y-4">
            {/* Synapse Insights Panel */}
            <div className="max-w-sm">
              <SynapseInsights 
                context={context} 
                compact={isCompact}
                maxInsights={isCompact ? 1 : 3}
              />
            </div>
            
            {/* Control buttons */}
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={toggleCompact}
                className="bg-white/90 backdrop-blur"
              >
                {isCompact ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={toggleVisibility}
                className="bg-white/90 backdrop-blur"
              >
                ×
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={toggleVisibility}
            className="rounded-full w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg"
          >
            <Brain className="h-6 w-6 text-white" />
          </Button>
        )}
      </div>
    </SynapseContext.Provider>
  );
};