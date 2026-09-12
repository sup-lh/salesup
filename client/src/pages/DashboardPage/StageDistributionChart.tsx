import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { TopLevelFormatterParams } from 'echarts/types/dist/shared';
import { GROWTH_STAGES } from '@shared/common';
import type { StageDistributionItem } from '@shared/api.interface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StageDistributionChartProps {
  items: StageDistributionItem[];
}

/** 阶段分布柱状图：x=四阶段、y=人数，tooltip 悬停展示平均闯关进度 */
const StageDistributionChart = ({ items }: StageDistributionChartProps) => {
  const countByStage = GROWTH_STAGES.map(
    (stage) => items.find((i) => i.stage === stage)?.count ?? 0,
  );
  const progressByStage = GROWTH_STAGES.map(
    (stage) => items.find((i) => i.stage === stage)?.avgProgress ?? 0,
  );

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: TopLevelFormatterParams) => {
        const list = Array.isArray(params) ? params : [params];
        const first = list[0];
        const idx = typeof first?.dataIndex === 'number' ? first.dataIndex : 0;
        return `${first?.name ?? ''}<br/>人数：${first?.value ?? 0}<br/>平均闯关进度：${progressByStage[idx] ?? 0}%`;
      },
    },
    legend: { bottom: 0, data: ['在培人数'] },
    grid: { left: '3%', right: '4%', bottom: '20%', containLabel: true },
    xAxis: {
      type: 'category',
      data: [...GROWTH_STAGES],
      boundaryGap: true,
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        name: '在培人数',
        type: 'bar',
        data: countByStage,
        barMaxWidth: 48,
        itemStyle: { color: '#2563eb', borderRadius: [6, 6, 0, 0] },
      },
    ],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">成长阶段分布</CardTitle>
      </CardHeader>
      <CardContent>
        <ReactECharts option={option} theme="ud" className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
};

export default StageDistributionChart;
