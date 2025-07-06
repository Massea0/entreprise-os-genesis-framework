import React from 'react';
import { MetricsCard } from '../../../components/enterprise/ui/MetricsCard';
import { BarChart3, Users, DollarSign, TrendingUp } from 'lucide-react';

export const DashboardModule: React.FC = () => {
  const metricsData = [
    {
      title: 'Chiffre d\'affaires',
      value: '€2,456,789',
      previousValue: '€2,123,456',
      trend: 'up' as const,
      percentage: 15.7,
      icon: DollarSign,
      color: 'success' as const,
      format: 'currency' as const
    },
    {
      title: 'Employés actifs',
      value: '247',
      previousValue: '238',
      trend: 'up' as const,
      percentage: 3.8,
      icon: Users,
      color: 'primary' as const,
      format: 'number' as const
    },
    {
      title: 'Projets en cours',
      value: '32',
      previousValue: '28',
      trend: 'up' as const,
      percentage: 14.3,
      icon: BarChart3,
      color: 'warning' as const,
      format: 'number' as const
    },
    {
      title: 'Croissance mensuelle',
      value: '18.2%',
      previousValue: '12.5%',
      trend: 'up' as const,
      percentage: 45.6,
      icon: TrendingUp,
      color: 'success' as const,
      format: 'percentage' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-enterprise-neutral-900 dark:text-white">
            Tableau de bord
          </h1>
          <p className="text-enterprise-neutral-600 dark:text-enterprise-neutral-400 mt-1">
            Vue d'ensemble de votre entreprise
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select className="px-3 py-2 border border-enterprise-neutral-300 dark:border-enterprise-neutral-600 rounded-lg bg-white dark:bg-enterprise-neutral-800 text-enterprise-neutral-900 dark:text-white">
            <option>30 derniers jours</option>
            <option>7 derniers jours</option>
            <option>90 derniers jours</option>
          </select>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsData.map((metricData, index) => {
          const metric = {
            id: `metric-${index}`,
            title: metricData.title,
            value: metricData.value,
            previousValue: metricData.previousValue,
            trend: {
              value: metricData.percentage,
              direction: metricData.trend,
              period: 'vs mois précédent'
            },
            icon: metricData.icon,
            color: metricData.color,
            format: metricData.format,
            period: 'month' as const,
            updatedAt: new Date().toISOString()
          };
          
          return (
            <MetricsCard
              key={index}
              metric={metric}
              color={metricData.color}
              className="h-full"
            />
          );
        })}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-enterprise-neutral-800 border border-enterprise-neutral-200 dark:border-enterprise-neutral-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-enterprise-neutral-900 dark:text-white mb-4">
            Évolution du chiffre d'affaires
          </h3>
          <div className="h-64 bg-enterprise-neutral-50 dark:bg-enterprise-neutral-900 rounded-lg flex items-center justify-center">
            <p className="text-enterprise-neutral-500 dark:text-enterprise-neutral-400">
              Graphique à venir
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-enterprise-neutral-800 border border-enterprise-neutral-200 dark:border-enterprise-neutral-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-enterprise-neutral-900 dark:text-white mb-4">
            Répartition des projets
          </h3>
          <div className="h-64 bg-enterprise-neutral-50 dark:bg-enterprise-neutral-900 rounded-lg flex items-center justify-center">
            <p className="text-enterprise-neutral-500 dark:text-enterprise-neutral-400">
              Graphique à venir
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-enterprise-neutral-800 border border-enterprise-neutral-200 dark:border-enterprise-neutral-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-enterprise-neutral-900 dark:text-white mb-4">
          Activité récente
        </h3>
        <div className="space-y-3">
          {[
            { action: 'Nouveau contrat signé', time: 'Il y a 2 heures', user: 'Marie Dubois' },
            { action: 'Rapport mensuel généré', time: 'Il y a 4 heures', user: 'Système' },
            { action: 'Nouveau client ajouté', time: 'Il y a 6 heures', user: 'Pierre Martin' },
            { action: 'Facture envoyée', time: 'Il y a 8 heures', user: 'Julie Lambert' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-enterprise-neutral-100 dark:border-enterprise-neutral-700 last:border-b-0">
              <div>
                <p className="font-medium text-enterprise-neutral-900 dark:text-white">
                  {activity.action}
                </p>
                <p className="text-sm text-enterprise-neutral-600 dark:text-enterprise-neutral-400">
                  par {activity.user}
                </p>
              </div>
              <span className="text-sm text-enterprise-neutral-500 dark:text-enterprise-neutral-400">
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardModule;
