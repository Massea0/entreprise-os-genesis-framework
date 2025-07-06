/**
 * === METRICS CARD COMPONENT ===
 * Composant de métriques enterprise avec variants et animations
 * Qualité exceptionnelle avec TypeScript strict
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MetricCard as MetricCardType } from '@/types/enterprise';

// === VARIANTS === //

const metricsCardVariants = cva(
  'relative overflow-hidden transition-all duration-300 hover:shadow-lg group',
  {
    variants: {
      color: {
        primary: 'border-l-4 border-l-enterprise-primary bg-gradient-to-r from-enterprise-primary/5 to-transparent',
        success: 'border-l-4 border-l-enterprise-success bg-gradient-to-r from-enterprise-success/5 to-transparent',
        warning: 'border-l-4 border-l-enterprise-warning bg-gradient-to-r from-enterprise-warning/5 to-transparent',
        error: 'border-l-4 border-l-enterprise-error bg-gradient-to-r from-enterprise-error/5 to-transparent',
        neutral: 'border-l-4 border-l-gray-400 bg-gradient-to-r from-gray-50 to-transparent',
      },
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      interactive: {
        true: 'cursor-pointer hover:scale-[1.02] hover:shadow-xl',
        false: '',
      },
    },
    defaultVariants: {
      color: 'primary',
      size: 'md',
      interactive: false,
    },
  }
);

const trendVariants = cva(
  'inline-flex items-center gap-1 text-sm font-medium transition-colors',
  {
    variants: {
      direction: {
        up: 'text-enterprise-success',
        down: 'text-enterprise-error',
        stable: 'text-gray-500',
      },
    },
  }
);

// === TYPES === //

interface MetricsCardProps extends VariantProps<typeof metricsCardVariants> {
  readonly metric: MetricCardType;
  readonly onClick?: () => void;
  readonly className?: string;
  readonly showTrend?: boolean;
  readonly animated?: boolean;
}

// === UTILITAIRES === //

const formatValue = (value: string | number, format: MetricCardType['format']): string => {
  if (typeof value === 'string') return value;
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'number':
    default:
      return new Intl.NumberFormat('fr-FR').format(value);
  }
};

const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
  switch (direction) {
    case 'up':
      return TrendingUp;
    case 'down':
      return TrendingDown;
    case 'stable':
      return Minus;
  }
};

// === COMPOSANT PRINCIPAL === //

export const MetricsCard: React.FC<MetricsCardProps> = ({
  metric,
  color = 'primary',
  size = 'md',
  interactive = false,
  onClick,
  className,
  showTrend = true,
  animated = true,
  ...props
}) => {
  const TrendIcon = metric.trend ? getTrendIcon(metric.trend.direction) : null;

  return (
    <Card
      className={cn(
        metricsCardVariants({ color, size, interactive }),
        className
      )}
      onClick={onClick}
      {...props}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {metric.title}
        </CardTitle>
        {metric.trend && showTrend && (
          <div className={cn(trendVariants({ direction: metric.trend.direction }))}>
            {TrendIcon && <TrendIcon className="h-4 w-4" />}
            <span>
              {metric.trend.value > 0 ? '+' : ''}
              {metric.trend.value.toFixed(1)}%
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div 
              className={cn(
                'text-2xl font-bold transition-all duration-500',
                animated && 'group-hover:scale-105'
              )}
            >
              {formatValue(metric.value, metric.format)}
            </div>
            
            {metric.trend && showTrend && (
              <p className="text-xs text-muted-foreground">
                {metric.trend.period}
              </p>
            )}
          </div>

          {/* Indicator visuel */}
          <div 
            className={cn(
              'h-12 w-1 rounded-full transition-all duration-300',
              color === 'primary' && 'bg-enterprise-primary',
              color === 'success' && 'bg-enterprise-success', 
              color === 'warning' && 'bg-enterprise-warning',
              color === 'error' && 'bg-enterprise-error',
              color === 'neutral' && 'bg-gray-400',
              animated && 'group-hover:h-16 group-hover:shadow-lg'
            )}
          />
        </div>
      </CardContent>

      {/* Effet de survol animé */}
      {animated && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
      )}
    </Card>
  );
};

// === COMPOSANT CONTAINER POUR GRILLE === //

interface MetricsGridProps {
  readonly metrics: readonly MetricCardType[];
  readonly columns?: 1 | 2 | 3 | 4;
  readonly gap?: 'sm' | 'md' | 'lg';
  readonly onMetricClick?: (metric: MetricCardType) => void;
  readonly className?: string;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  columns = 4,
  gap = 'md',
  onMetricClick,
  className,
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const gridGap = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  return (
    <div className={cn(
      'grid',
      gridCols[columns],
      gridGap[gap],
      className
    )}>
      {metrics.map((metric) => (
        <MetricsCard
          key={metric.id}
          metric={metric}
          color={metric.color}
          interactive={!!onMetricClick}
          onClick={() => onMetricClick?.(metric)}
          animated
          showTrend
        />
      ))}
    </div>
  );
};

// === EXPORTS === //

export default MetricsCard;
