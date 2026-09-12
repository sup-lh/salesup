import { UserRound } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { NewcomerSummary } from '@shared/api.interface';

/** 「我的视角」哨兵值（SelectItem 禁止空字符串 value，页面层将其映射回空串） */
export const SELF_VIEW_VALUE = '__my_view__';

interface WorkbenchNewcomerSwitcherProps {
  newcomers: NewcomerSummary[];
  value: string;
  onChange: (value: string) => void;
  viewingName: string | null;
}

/** 管理员视角切换条：选择查看任意新人的工作台档案 */
const WorkbenchNewcomerSwitcher = ({
  newcomers,
  value,
  onChange,
  viewingName,
}: WorkbenchNewcomerSwitcherProps) => (
  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
    <div className="flex items-center gap-2">
      <UserRound className="size-4 shrink-0 text-primary" />
      <Select value={value || SELF_VIEW_VALUE} onValueChange={onChange}>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="选择查看的新人" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SELF_VIEW_VALUE}>我的视角</SelectItem>
          {newcomers.map((item: NewcomerSummary) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    {viewingName && (
      <span className="text-sm text-muted-foreground">
        正在查看：{viewingName}
      </span>
    )}
  </div>
);

export default WorkbenchNewcomerSwitcher;
