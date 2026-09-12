import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { TopLevelFormatterParams } from 'echarts/types/dist/shared';
import { Handshake, ListChecks, Target } from 'lucide-react';
import type { ActionStats } from '@shared/api.interface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActionStatsSectionProps {
  stats: ActionStats;
}

interface ActionMetric {
  name: string;
  value: number;
  color: string;
}

/** 关键动作统计：有效拜访 / 商机录入横向柱状图 + 打卡完成率指标卡 */
const ActionStatsSection = ({ stats }: ActionStatsSectionProps) => {
  const metrics: ActionMetric[] = [
    { name: '有效拜访量', value: stats.visitCount, color: '#2563eb' },
    { name: '商机录入量', value: stats.opportunityCount, color: '#f97316' },
  ];

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: TopLevelFormatterParams) => {
        const list = Array.isArray(params) ? params : [params];
        return list.map((p) => `${p.name}：${p.value}`).join('<br/>');
      },
    },
    legend: { bottom: 0, data: ['完成数量'] },
    grid: { left: '3%', right: '8%', bottom: '20%', containLabel: true },
    xAxis: { type: 'value', minInterval: 1 },
    yAxis: {
      type: 'category',
      data: [...metrics].reverse().map((m) => m.name),
    },
    series: [
      {
        name: '完成数量',
        type: 'bar',
        data: [...metrics]
          .reverse()
          .map((m) => ({ value: m.value, itemStyle: { color: m.color } })),
        barMaxWidth: 28,
        itemStyle: { borderRadius: [0, 6, 6, 0] },
        label: { show: true, position: 'right' },
      },
    ],
  };

  const checkinWidth = Math.min(100, Math.max(0, stats.checkinRate));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">关键动作统计</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ReactECharts option={option} theme="ud" className="h-[300px] w-full" />
          </div>
          <div className="flex flex-col justify-center gap-6 lg:col-span-2">
            <div className="flex items-center gap-4 rounded-xl border border-border bg-blue-50/50 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Handshake className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">有效拜访量</p>
                <p className="text-2xl font-bold tracking-tight">{stats.visitCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-border bg-orange-50/50 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">商机录入量</p>
                <p className="text-2xl font-bold tracking-tight">
                  {stats.opportunityCount}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-border p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ListChecks className="h-4 w-4" />
                  打卡完成率
                </div>
                <p className="text-2xl font-bold tracking-tight">
                  {stats.checkinRate}
                  <span className="text-sm font-medium text-muted-foreground">%</span>
                </p>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${checkinWidth}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionStatsSection;
