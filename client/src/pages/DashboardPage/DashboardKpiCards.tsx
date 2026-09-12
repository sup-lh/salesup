import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Minus,
  ShieldCheck,
  Target,
  Timer,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import type {
  DashboardKpiDeltas,
  DashboardKpis,
} from '@shared/api.interface';

interface DashboardKpiCardsProps {
  kpis: DashboardKpis;
  kpiDeltas: DashboardKpiDeltas;
}

interface KpiDelta {
  up: boolean;
  text: string;
}

/** 留存率 / 转正率的较上期变化展示 */
function DeltaBadge({ delta }: { delta: number }): KpiDelta | null {
  if (delta === 0) return null;
  const up = delta > 0;
  return {
    up,
    text: `较上期 ${up ? '+' : ''}${delta}%`,
  };
}

const DeltaView = ({ delta }: { delta: number }) => {
  const badge = DeltaBadge({ delta });
  if (!badge) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        与上期持平
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        badge.up ? 'text-emerald-600' : 'text-red-600'
      }`}
    >
      {badge.up ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {badge.text}
    </span>
  );
};

const KpiIcon = ({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'blue' | 'green' | 'orange';
}) => (
  <div
    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
      tone === 'blue'
        ? 'bg-blue-50 text-blue-600'
        : tone === 'green'
          ? 'bg-emerald-50 text-emerald-600'
          : 'bg-orange-50 text-orange-600'
    }`}
  >
    {children}
  </div>
);

const DashboardKpiCards = ({ kpis, kpiDeltas }: DashboardKpiCardsProps) => {
  const cards: Array<{
    key: string;
    label: string;
    icon: React.ReactNode;
    tone: 'blue' | 'green' | 'orange';
    value: string;
    suffix?: string;
    valueNull: boolean;
    footer: React.ReactNode;
  }> = [
    {
      key: 'total',
      label: '在培新人总数',
      icon: <Users className="h-5 w-5" />,
      tone: 'blue',
      value: String(kpis.total),
      valueNull: false,
      footer: <span className="text-xs text-muted-foreground">当前在培（active）人数</span>,
    },
    {
      key: 'retentionRate',
      label: '3个月留存率',
      icon: <ShieldCheck className="h-5 w-5" />,
      tone: 'green',
      value: String(kpis.retentionRate),
      suffix: '%',
      valueNull: false,
      footer: <DeltaView delta={kpiDeltas.retentionRate} />,
    },
    {
      key: 'conversionRate',
      label: '试用期转正率',
      icon: <BadgeCheck className="h-5 w-5" />,
      tone: 'green',
      value: String(kpis.conversionRate),
      suffix: '%',
      valueNull: false,
      footer: <DeltaView delta={kpiDeltas.conversionRate} />,
    },
    {
      key: 'avgRampDays',
      label: '平均达产周期',
      icon: <Timer className="h-5 w-5" />,
      tone: 'orange',
      value: kpis.avgRampDays === null ? '暂无数据' : String(kpis.avgRampDays),
      suffix: kpis.avgRampDays === null ? undefined : '天',
      valueNull: kpis.avgRampDays === null,
      footer: <span className="text-xs text-muted-foreground">目标 ≤60天</span>,
    },
    {
      key: 'avgFirstDealDays',
      label: '首单平均时间',
      icon: <Target className="h-5 w-5" />,
      tone: 'orange',
      value:
        kpis.avgFirstDealDays === null ? '暂无数据' : String(kpis.avgFirstDealDays),
      suffix: kpis.avgFirstDealDays === null ? undefined : '天',
      valueNull: kpis.avgFirstDealDays === null,
      footer: <span className="text-xs text-muted-foreground">目标 ≤30天</span>,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.key} className="p-6" data-ai-section-type="card-stat">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="flex items-baseline gap-1">
                <span
                  className={`text-3xl font-bold tracking-tight ${
                    card.valueNull ? 'text-xl text-muted-foreground' : ''
                  }`}
                >
                  {card.value}
                </span>
                {card.suffix ? (
                  <span className="text-sm font-medium text-muted-foreground">
                    {card.suffix}
                  </span>
                ) : null}
              </p>
            </div>
            <KpiIcon tone={card.tone}>{card.icon}</KpiIcon>
          </div>
          <div className="mt-3">{card.footer}</div>
        </Card>
      ))}
    </div>
  );
};

export default DashboardKpiCards;
