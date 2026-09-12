import { useState } from 'react';
import dayjs from 'dayjs';
import { CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface NewcomerDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** 是否显示清空按钮（默认隐藏） */
  clearable?: boolean;
  disabled?: boolean;
}

/** 日期选择字段：Popover + Calendar，禁止 input[type=date] */
export function NewcomerDatePicker({
  value,
  onChange,
  placeholder = '请选择日期',
  clearable = false,
  disabled = false,
}: NewcomerDatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? dayjs(value).toDate() : undefined;

  return (
    <div className="flex w-full items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            {value ? dayjs(value).format('YYYY-MM-DD') : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(day: Date | undefined) => {
              onChange(day ? dayjs(day).format('YYYY-MM-DD') : '');
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {clearable && value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          disabled={disabled}
          aria-label="清空日期"
          onClick={() => onChange('')}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}

export default NewcomerDatePicker;
