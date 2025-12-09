/**
 * Analytics Page
 *
 * Displays Claude Code usage analytics with charts and tables.
 * Features daily/monthly views, trend charts, model breakdown, and session history.
 */

import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { startOfMonth, subDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangeFilter } from '@/components/analytics/date-range-filter';
import { UsageSummaryCards } from '@/components/analytics/usage-summary-cards';
import { UsageTrendChart } from '@/components/analytics/usage-trend-chart';
import { ModelBreakdownChart } from '@/components/analytics/model-breakdown-chart';
import { SessionsTable } from '@/components/analytics/sessions-table';
import { TrendingUp, BarChart3, Clock, Calendar, Download, RefreshCw } from 'lucide-react';
import {
  useUsageSummary,
  useUsageTrends,
  useModelUsage,
  useSessions,
  useRefreshUsage,
} from '@/hooks/use-usage';

type ViewMode = 'daily' | 'monthly' | 'sessions';

export function AnalyticsPage() {
  // Default to last 30 days
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh hook
  const refreshUsage = useRefreshUsage();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshUsage();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Convert dates to API format
  const apiOptions = {
    startDate: dateRange?.from,
    endDate: dateRange?.to,
  };

  // Fetch data
  const { data: summary, isLoading: isSummaryLoading } = useUsageSummary(apiOptions);
  const { data: trends, isLoading: isTrendsLoading } = useUsageTrends(apiOptions);
  const { data: models, isLoading: isModelsLoading } = useModelUsage(apiOptions);
  const { data: sessions, isLoading: isSessionsLoading } = useSessions({
    ...apiOptions,
    limit: 50,
  });

  // Loading state
  if (isSummaryLoading || isTrendsLoading || isModelsLoading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-muted-foreground">Track your Claude Code usage and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter
        value={dateRange}
        onChange={setDateRange}
        presets={[
          { label: 'Last 7 days', range: { from: subDays(new Date(), 7), to: new Date() } },
          { label: 'Last 30 days', range: { from: subDays(new Date(), 30), to: new Date() } },
          { label: 'This month', range: { from: startOfMonth(new Date()), to: new Date() } },
          { label: 'Last 3 months', range: { from: subDays(new Date(), 90), to: new Date() } },
        ]}
      />

      {/* Summary Cards */}
      <UsageSummaryCards data={summary} isLoading={isSummaryLoading} />

      {/* Main Content Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Daily
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Monthly
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Clock className="w-4 h-4" />
            Sessions
          </TabsTrigger>
        </TabsList>

        {/* Daily View */}
        <TabsContent value="daily" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Usage Trend Chart */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Usage Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UsageTrendChart data={trends || []} isLoading={isTrendsLoading} />
              </CardContent>
            </Card>

            {/* Model Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Model Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ModelBreakdownChart data={models || []} isLoading={isModelsLoading} />
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Cost by Model</CardTitle>
              </CardHeader>
              <CardContent>
                {isModelsLoading ? (
                  <Skeleton className="h-[200px]" />
                ) : (
                  <div className="space-y-3">
                    {models?.slice(0, 5).map((model) => (
                      <div key={model.model} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getModelColor(model.model) }}
                          />
                          <span className="text-sm font-medium">{model.model}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ${model.cost.toFixed(4)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monthly View */}
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Monthly Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UsageTrendChart
                data={trends || []}
                isLoading={isTrendsLoading}
                granularity="monthly"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions View */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Session History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SessionsTable data={sessions} isLoading={isSessionsLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to generate consistent colors for models
function getModelColor(model: string): string {
  const colors = [
    '#0080FF',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#8884D8',
    '#82CA9D',
    '#FFC658',
    '#8DD1E1',
    '#D084D0',
    '#87D068',
  ];

  let hash = 0;
  for (let i = 0; i < model.length; i++) {
    hash = model.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

// Skeleton loading state
function AnalyticsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-[120px] mb-2" />
        <Skeleton className="h-4 w-[300px]" />
      </div>

      {/* Date Filter */}
      <Skeleton className="h-10 w-[300px]" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-[100px] mb-2" />
              <Skeleton className="h-8 w-[60px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-[120px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px]" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[120px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px]" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
