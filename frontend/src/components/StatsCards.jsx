import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { leadAPI } from '@/services/api';
import { TrendingUp, CheckCircle, AlertCircle, Loader2, Activity } from 'lucide-react';

/**
 * StatsCards Component
 * Displays statistics about leads
 */
export default function StatsCards() {
  const { data, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => leadAPI.getStats(),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const stats = data?.data || {};

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.total || 0,
      icon: Activity,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Verified',
      value: stats.verified || 0,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'To Check',
      value: stats.toCheck || 0,
      icon: AlertCircle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Synced to CRM',
      value: stats.synced || 0,
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover-lift hover-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-3xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
