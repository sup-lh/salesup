import { useState } from 'react';
import { ChevronDown, UserCheck, Users } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image } from '@client/src/components/ui/image';
import { cn } from '@/lib/utils';
import type { MentorInfo } from '@shared/api.interface';

interface MentorCardProps {
  mentor: MentorInfo | null;
}

/** 我的带教信息卡：师傅信息 + 本周陪访 + 最近带教记录（点击姓名展开） */
const MentorCard = ({ mentor }: MentorCardProps) => {
  const [expanded, setExpanded] = useState(false);

  if (!mentor) {
    return (
      <Card className="rounded-xl border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <UserCheck className="size-4 text-success" />
            我的带教
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <Users className="size-4" />
            暂未分配导师
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border-border border-l-4 border-l-success bg-card shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <UserCheck className="size-4 text-success" />
          我的带教
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 ring-1 ring-primary/15">
            {mentor.avatar ? (
              <Image
                src={mentor.avatar}
                alt={mentor.name}
                width={44}
                height={44}
                className="size-11 object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-primary">
                {mentor.name.slice(-2)}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto gap-1 px-1 py-0.5 font-semibold text-foreground"
            onClick={() => setExpanded((prev: boolean) => !prev)}
            aria-expanded={expanded}
          >
            {mentor.name}
            <ChevronDown
              className={cn(
                'size-4 text-muted-foreground transition-transform duration-200',
                expanded && 'rotate-180',
              )}
            />
          </Button>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-primary/[0.05] px-3 py-2.5">
          <span className="text-sm text-muted-foreground">本周陪访</span>
          <span className="flex items-baseline gap-1">
            <span className="font-display text-lg font-bold tabular-nums text-primary">
              {mentor.weeklyVisits}
            </span>
            <span className="text-xs text-muted-foreground">次</span>
          </span>
        </div>
        {mentor.recentRecords.length > 0 && (
          <div
            className={cn(
              'space-y-2 overflow-hidden transition-all duration-200 ease-out',
              expanded ? 'max-h-96' : 'max-h-0',
            )}
          >
            <div className="text-xs font-medium text-muted-foreground">
              最近带教记录
            </div>
            <ul className="space-y-2">
              {mentor.recentRecords.map((record: string, index: number) => (
                <li
                  key={`${index}-${record.slice(0, 12)}`}
                  className="rounded-lg border border-border/70 px-3 py-2 text-xs leading-relaxed text-foreground"
                >
                  {record}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MentorCard;
