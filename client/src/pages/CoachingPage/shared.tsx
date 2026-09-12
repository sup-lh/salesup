import { useState } from 'react';
import dayjs from 'dayjs';
import { CalendarIcon, Inbox, Plus, RotateCcw, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@client/src/components/ui/button';
import { Calendar } from '@client/src/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@client/src/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { Alert, AlertDescription } from '@client/src/components/ui/alert';

export interface NewcomerOption {
  id: string;
  name: string;
}

/** 把文本第一句拆出来，用于关键句强调色渲染 */
export function splitFirstSentence(text: string): [string, string] {
  const match = text.match(/^[^。！？!?]*[。！？!?]/);
  if (!match) return [text, ''];
  return [match[0], text.slice(match[0].length)];
}

export interface DatePickerPopoverProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** Popover + Calendar 日期选择（YYYY-MM-DD），禁止 input[type=date] */
export function DatePickerPopover({
  value,
  onChange,
  placeholder = '选择日期',
  className,
}: DatePickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? dayjs(value).toDate() : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start font-normal',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date: Date | undefined) => {
            onChange(date ? dayjs(date).format('YYYY-MM-DD') : '');
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export interface FilterBarProps {
  typeValue: string;
  typeOptions: { value: string; label: string }[];
  onTypeChange: (value: string) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onReset: () => void;
  onAdd: () => void;
}

/** 分区筛选条：类型 + 时间范围 + 新增按钮 */
export function FilterBar({
  typeValue,
  typeOptions,
  onTypeChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onReset,
  onAdd,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={typeValue} onValueChange={onTypeChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {typeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DatePickerPopover
        value={startDate}
        onChange={onStartDateChange}
        placeholder="开始日期"
        className="w-[130px]"
      />
      <span className="text-sm text-muted-foreground">至</span>
      <DatePickerPopover
        value={endDate}
        onChange={onEndDateChange}
        placeholder="结束日期"
        className="w-[130px]"
      />
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={onReset}
      >
        <RotateCcw className="size-4" />
        重置
      </Button>
      <div className="ml-auto">
        <Button onClick={onAdd}>
          <Plus className="size-4" />
          新增记录
        </Button>
      </div>
    </div>
  );
}

export function ListLoading() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1, 2].map((key) => (
        <div
          key={key}
          className="h-24 animate-pulse rounded-xl bg-muted"
          data-testid="list-skeleton"
        />
      ))}
    </div>
  );
}

export function ListError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <TriangleAlert className="size-4" />
      <AlertDescription className="flex flex-wrap items-center gap-3">
        <span>{message}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          重试
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function ListEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-12 text-muted-foreground">
      <Inbox className="size-8" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
