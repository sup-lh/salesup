import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Search, UserRound, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { listUsersByIds, searchUsers } from '@client/src/components/business-ui/api/users/service';
import type { LocalUserOption, UserSelectProps } from './types';

export function UserSelect({ value, defaultValue = null, onChange, placeholder = '请选择人员', disabled, required, name, className }: UserSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<LocalUserOption[]>([]);
  const [selected, setSelected] = useState<LocalUserOption | null>(null);
  const selectedId = value === undefined ? defaultValue : value;

  useEffect(() => {
    if (!selectedId) { setSelected(null); return; }
    let active = true;
    void listUsersByIds([selectedId]).then((response) => {
      const user = response.data.userInfoMap[selectedId];
      if (active) setSelected(user ? { id: user.userID, displayName: user.name.zh_cn, email: user.email, avatarUrl: user.avatar?.image.large } : null);
    });
    return () => { active = false; };
  }, [selectedId]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void searchUsers({ query, pageSize: 30 }).then((response) => {
        setOptions(response.data.userList.map((user) => ({ id: user.userID, displayName: user.name.zh_cn, email: user.email, avatarUrl: user.avatar?.image.large })));
      }).catch(() => setOptions([]));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [open, query]);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <input type="hidden" name={name} value={selectedId ?? ''} required={required} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" role="combobox" aria-expanded={open} disabled={disabled} className="min-w-0 flex-1 justify-between font-normal">
            {selected ? <span className="flex min-w-0 items-center gap-2"><Avatar className="size-5"><AvatarImage src={selected.avatarUrl} alt="" /><AvatarFallback><UserRound className="size-3" /></AvatarFallback></Avatar><span className="truncate">{selected.displayName}</span></span> : <span className="text-muted-foreground">{placeholder}</span>}
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-2">
          <div className="mb-2 flex items-center gap-2"><Search className="size-4 text-muted-foreground" /><Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索姓名、账号或邮箱" /></div>
          <div className="max-h-64 overflow-y-auto">
            {options.map((option) => (
              <button key={option.id} type="button" className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { setSelected(option); onChange?.(option.id); setOpen(false); setQuery(''); }}>
                <Avatar className="size-6"><AvatarImage src={option.avatarUrl} alt="" /><AvatarFallback>{option.displayName.slice(0, 1)}</AvatarFallback></Avatar>
                <span className="min-w-0 flex-1"><span className="block truncate">{option.displayName}</span>{option.email ? <span className="block truncate text-xs text-muted-foreground">{option.email}</span> : null}</span>
                {option.id === selectedId ? <Check className="size-4 text-primary" /> : null}
              </button>
            ))}
            {options.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">没有匹配的本地账号</p> : null}
          </div>
        </PopoverContent>
      </Popover>
      {selectedId && !disabled ? <Button type="button" variant="ghost" size="icon" className="size-9 shrink-0" title="清除人员" onClick={() => { setSelected(null); onChange?.(null); }}><X className="size-4" /></Button> : null}
    </div>
  );
}
