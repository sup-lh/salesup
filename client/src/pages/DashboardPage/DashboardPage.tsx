import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboard as dashboardApi } from '@/api';
import type {
  DashboardPeriod,
  DashboardStatisticsResponse,
} from '@shared/api.interface';
import DashboardKpiCards from './DashboardKpiCards';
import StageDistributionChart from './StageDistributionChart';
import CoursePassRateChart from './CoursePassRateChart';
import ActionStatsSection from './ActionStatsSection';

const PERIOD_OPTIONS: Array<{ value: DashboardPeriod; label: string }> = [
  { value: 'quarter', label: '近90天' },
  { value: 'half_year', label: '近半年' },
  { value: 'all', label: '全部' },
];

const DashboardPage = () => {
  const [period, setPeriod] = useState<DashboardPeriod>('quarter');
  const [data, setData] = useState<DashboardStatisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (target: DashboardPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardApi.fetchDashboardStatistics(target);
      setData(response);
    } catch {
      setError('看板数据加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(period);
  }, [period, load]);

  return (
    <div className="mx-auto w-full max-w-[1400px] p-6">
      {/* 页头：标题 + 时间段切换 */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">成长数据看板</h1>
            <p className="text-sm text-muted-foreground">新人培养核心指标与统计</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {PERIOD_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={period === option.value ? 'default' : 'ghost'}
              onClick={() => setPeriod(option.value)}
              disabled={loading}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-6" data-ai-section-type="card-list">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index: number) => (
              <div
                key={index}
                className="h-[148px] animate-pulse rounded-xl border border-border bg-card"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="h-[440px] animate-pulse rounded-xl border border-border bg-card" />
            <div className="h-[440px] animate-pulse rounded-xl border border-border bg-card" />
          </div>
          <div className="h-[480px] animate-pulse rounded-xl border border-border bg-card" />
        </div>
      ) : error !== null ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-12">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button type="button" variant="outline" onClick={() => void load(period)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            重试
          </Button>
        </div>
      ) : data === null ? (
        <div className="flex items-center justify-center rounded-xl border border-border bg-card p-12 text-sm text-muted-foreground">
          暂无数据
        </div>
      ) : (
        <div className="space-y-6">
          <DashboardKpiCards kpis={data.kpis} kpiDeltas={data.kpiDeltas} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <StageDistributionChart items={data.stageDistribution} />
            <CoursePassRateChart items={data.passRates} />
          </div>
          <ActionStatsSection stats={data.actionStats} />
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
