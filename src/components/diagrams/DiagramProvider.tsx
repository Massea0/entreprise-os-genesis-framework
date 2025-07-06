import React, { createContext, useContext, ReactNode } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Types pour le framework de diagrammes
export interface DiagramNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: any;
}

export interface DiagramConfig {
  type: 'org_chart' | 'workflow' | 'gantt' | 'custom';
  layout?: 'hierarchical' | 'force' | 'grid' | 'manual';
  interactions?: {
    draggable?: boolean;
    connectable?: boolean;
    deletable?: boolean;
    selectable?: boolean;
  };
  styling?: {
    theme?: 'light' | 'dark' | 'enterprise';
    colors?: Record<string, string>;
  };
}

interface DiagramContextType {
  config: DiagramConfig;
  setConfig: (config: DiagramConfig) => void;
}

const DiagramContext = createContext<DiagramContextType | undefined>(undefined);

export const useDiagram = () => {
  const context = useContext(DiagramContext);
  if (!context) {
    throw new Error('useDiagram must be used within a DiagramProvider');
  }
  return context;
};

interface DiagramProviderProps {
  children: ReactNode;
  config?: DiagramConfig;
}

export const DiagramProvider: React.FC<DiagramProviderProps> = ({ 
  children, 
  config: initialConfig 
}) => {
  const [config, setConfig] = React.useState<DiagramConfig>(
    initialConfig || {
      type: 'org_chart',
      layout: 'hierarchical',
      interactions: {
        draggable: true,
        connectable: false,
        deletable: false,
        selectable: true,
      },
      styling: {
        theme: 'enterprise',
      },
    }
  );

  return (
    <DiagramContext.Provider value={{ config, setConfig }}>
      <ReactFlowProvider>
        {children}
      </ReactFlowProvider>
    </DiagramContext.Provider>
  );
};

export default DiagramProvider;
