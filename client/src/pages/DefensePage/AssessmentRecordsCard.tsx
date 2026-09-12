import { Calendar, Clock, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { AssessmentRecord } from '@shared/api.interface';

/** 节点考核固定节点 */
const ASSESSMENT_NODES: Array<AssessmentRecord['node']> = ['30天', '60天', '90天'];

/** 考核结果 → 徽章样式 */
const RESULT_BADGE_CLASS: Record<AssessmentRecord['result'], string> = {
  通过: 'border-success/30 bg-success/10 text-success',
  待改进: 'border-warning/30 bg-warning/10 text-warning',
  不通过: 'border-destructive/30 bg-destructive/10 text-destructive',
};

interface AssessmentRecordsCardProps {
  assessments: AssessmentRecord[];
}

/** 节点考核留档卡：30/60/90 天三次考核记录，暂无记录显示待考核占位 */
const AssessmentRecordsCard = ({
  assessments,
}: AssessmentRecordsCardProps) => (
  <Card className="rounded-xl border-border shadow-sm">
    <CardHeader className="pb-4">
      <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
        <Calendar className="size-4 text-primary" />
        节点考核留档
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {ASSESSMENT_NODES.map((node) => {
        const record: AssessmentRecord | undefined = assessments.find(
          (item) => item.node === node,
        );
        if (!record) {
          return (
            <div
              key={node}
              className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2.5"
            >
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-4 text-muted-foreground/60" />
                {node}节点考核
              </span>
              <span className="font-display text-xs text-muted-foreground">待考核</span>
            </div>
          );
        }
        return (
          <div
            key={record.id}
            className="space-y-1.5 rounded-lg border border-border px-3 py-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">
                {node}节点考核
              </span>
              <Badge
                variant="outline"
                className={`font-display ${RESULT_BADGE_CLASS[record.result]}`}
              >
                {record.result}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="size-3.5" />
                考核人：{record.assessorName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" />
                {record.recordDate}
              </span>
            </div>
            {record.comment && (
              <p className="text-xs leading-relaxed text-foreground/80">
                评语：{record.comment}
              </p>
            )}
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default AssessmentRecordsCard;
