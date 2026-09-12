import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type {
  CallbackDataParams,
  TopLevelFormatterParams,
} from 'echarts/types/dist/shared';
import type { CoursePassRateItem } from '@shared/api.interface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CoursePassRateChartProps {
  items: CoursePassRateItem[];
}

/** 模块通关通过率条形图：y=课程名、x=通过率%，标签显示百分比 */
const CoursePassRateChart = ({ items }: CoursePassRateChartProps) => {
  // yAxis category 自下而上，reverse 让 sort 靠前的课程显示在顶部
  const reversed = [...items].reverse();
  const titles = reversed.map((i) => i.courseTitle);
  const rates = reversed.map((i) => i.passRate);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: TopLevelFormatterParams) => {
        const list = Array.isArray(params) ? params : [params];
        const first = list[0];
        return `${first?.name ?? ''}：${first?.value ?? 0}%`;
      },
    },
    legend: { bottom: 0, data: ['通过率'] },
    grid: { left: '3%', right: '10%', bottom: '20%', containLabel: true },
    xAxis: { type: 'value', max: 100 },
    yAxis: { type: 'category', data: titles },
    series: [
      {
        name: '通过率',
        type: 'bar',
        data: rates,
        barMaxWidth: 20,
        itemStyle: { color: '#f97316', borderRadius: [0, 6, 6, 0] },
        label: {
          show: true,
          position: 'right',
          formatter: (p: CallbackDataParams) => `${p.value}%`,
        },
      },
    ],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">模块通关通过率</CardTitle>
      </CardHeader>
      <CardContent>
        <ReactECharts option={option} theme="ud" className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
};

export default CoursePassRateChart;
