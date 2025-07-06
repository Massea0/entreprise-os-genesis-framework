import React, { useRef, useEffect, useCallback } from 'react';
import './synapse-volume-visualizer.scss';

interface SynapseVolumeVisualizerProps {
  volume: number;
  isListening: boolean;
  isProcessing?: boolean;
  className?: string;
  style?: 'pulse' | 'bars' | 'wave';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const SynapseVolumeVisualizer: React.FC<SynapseVolumeVisualizerProps> = ({
  volume,
  isListening,
  isProcessing = false,
  className = '',
  style = 'pulse',
  size = 'md',
  color = '#8b5cf6'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pulseOffsetRef = useRef(0);

  // Dimensions basées sur la taille
  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { width: 120, height: 80 };
      case 'lg':
        return { width: 200, height: 120 };
      default:
        return { width: 160, height: 100 };
    }
  };

  const { width, height } = getDimensions();

  /**
   * Animation de type pulse (inspirée de Gemini Live)
   */
  const drawPulseAnimation = useCallback((ctx: CanvasRenderingContext2D, timestamp: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.15;
    
    // Nettoyage du canvas
    ctx.clearRect(0, 0, width, height);
    
    if (isListening || isProcessing) {
      // Animation de pulsation basée sur le volume
      const pulseIntensity = Math.max(0.3, volume * 2);
      const animationSpeed = isProcessing ? 0.003 : 0.005;
      pulseOffsetRef.current += animationSpeed;
      
      // Cercles concentriques animés
      for (let i = 0; i < 3; i++) {
        const phase = pulseOffsetRef.current + (i * Math.PI / 3);
        const radiusMultiplier = 1 + Math.sin(phase) * pulseIntensity;
        const radius = baseRadius * radiusMultiplier * (1 + i * 0.3);
        const opacity = (0.8 - i * 0.2) * (isProcessing ? 0.7 : 1);
        
        // Gradient radial
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${color}00`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Cercle central
      ctx.fillStyle = color;
      ctx.globalAlpha = isProcessing ? 0.6 : 0.9;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      // État inactif - cercle statique
      ctx.fillStyle = `${color}40`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 0.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Bordure
      ctx.strokeStyle = `${color}80`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [width, height, volume, isListening, isProcessing, color]);

  /**
   * Animation de type barres
   */
  const drawBarsAnimation = useCallback((ctx: CanvasRenderingContext2D, timestamp: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const barCount = 12;
    const barWidth = width / (barCount * 2);
    const maxBarHeight = height * 0.8;
    const baseHeight = height * 0.1;
    
    for (let i = 0; i < barCount; i++) {
      const x = (i * 2 + 1) * barWidth;
      const animationPhase = (timestamp * 0.003) + (i * 0.5);
      const heightMultiplier = isListening ? 
        Math.max(0.2, volume + Math.sin(animationPhase) * 0.3) : 
        0.2;
      
      const barHeight = baseHeight + (maxBarHeight * heightMultiplier);
      const y = height - barHeight;
      
      // Gradient vertical
      const gradient = ctx.createLinearGradient(0, y, 0, height);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, `${color}80`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }, [width, height, volume, isListening, color]);

  /**
   * Animation de type onde
   */
  const drawWaveAnimation = useCallback((ctx: CanvasRenderingContext2D, timestamp: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const centerY = height / 2;
    const amplitude = height * 0.3 * (isListening ? Math.max(0.3, volume) : 0.1);
    const frequency = 0.02;
    const speed = isProcessing ? 0.001 : 0.003;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const y = centerY + Math.sin((x * frequency) + (timestamp * speed)) * amplitude;
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }, [width, height, volume, isListening, isProcessing, color]);

  /**
   * Boucle d'animation principale
   */
  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Sélection du style d'animation
    switch (style) {
      case 'bars':
        drawBarsAnimation(ctx, timestamp);
        break;
      case 'wave':
        drawWaveAnimation(ctx, timestamp);
        break;
      default:
        drawPulseAnimation(ctx, timestamp);
    }
    
    // Continuer l'animation
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [style, drawPulseAnimation, drawBarsAnimation, drawWaveAnimation]);

  /**
   * Démarrage/arrêt de l'animation
   */
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  /**
   * Configuration du canvas
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Configuration DPI pour la netteté
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, [width, height]);

  return (
    <div className={`synapse-volume-visualizer ${className} ${size} ${isListening ? 'listening' : ''} ${isProcessing ? 'processing' : ''}`}>
      <canvas
        ref={canvasRef}
        className="synapse-volume-canvas"
        style={{ width, height }}
      />
      
      {/* Indicateur d'état textuel */}
      <div className="synapse-volume-status">
        {isProcessing && <span className="processing-indicator">Traitement...</span>}
        {isListening && !isProcessing && <span className="listening-indicator">À l'écoute</span>}
        {!isListening && !isProcessing && <span className="idle-indicator">Inactif</span>}
      </div>
      
      {/* Indicateur de volume numérique */}
      {isListening && (
        <div className="synapse-volume-meter">
          <div className="volume-bar">
            <div 
              className="volume-fill"
              style={{ 
                width: `${Math.min(100, volume * 100)}%`,
                backgroundColor: color
              }}
            />
          </div>
          <span className="volume-text">{Math.round(volume * 100)}%</span>
        </div>
      )}
    </div>
  );
};

export default SynapseVolumeVisualizer;
