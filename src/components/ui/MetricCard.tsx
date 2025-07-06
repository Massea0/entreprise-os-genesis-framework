/**
 * Composant de métrique amélioré pour le Dashboard
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'stable';
  icon: LucideIcon;
  color: string;
  bgColor?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  trend,
  trendDirection,
  icon: Icon,
  color,
  bgColor,
  className
}) => {
  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trendDirection) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      case 'stable':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105",
      bgColor,
      className
    )}>
      {/* Gradient overlay for visual appeal */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/10 dark:from-transparent dark:via-black/5 dark:to-black/10" />
      
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold text-foreground/80">
          {title}
        </CardTitle>
        <div className={cn(
          "p-2 rounded-lg transition-all duration-300 group-hover:scale-110",
          bgColor?.replace('50', '100').replace('950', '800') || 'bg-muted'
        )}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="text-3xl font-bold tracking-tight text-foreground mb-1">
          {value}
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          {description}
        </p>
        
        {trend && trendDirection && (
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className={cn("text-sm font-medium", getTrendColor())}>
              {trend}
            </span>
            <span className="text-xs text-muted-foreground">vs mois dernier</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
