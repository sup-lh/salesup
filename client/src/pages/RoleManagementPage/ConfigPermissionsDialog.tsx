import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@client/src/components/ui/accordion';
import { Button } from '@client/src/components/ui/button';
import { Checkbox } from '@client/src/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { batchUpdateRoleMappings } from '@client/src/api/roleManager';
import type {
  ForceRoleDTO,
  PermissionItem,
  RolePermissionMapping,
} from '@shared/api.interface';

/** Subject 中文映射 */
const SUBJECT_LABELS: Record<string, string> = {
  Permission: '权限管理',
  Workbench: '工作台',
  NewcomerSelf: '新人档案导入',
  Challenge: '闯关地图',
  TaskRecord: '任务打卡',
  Course: '课程中心',
  CourseLearning: '学习进度',
  ExamResult: '课程考试',
  Coaching: '带教复盘',
  Assessment: '考核记录',
  Newcomer: '新人管理',
  Dashboard: '数据看板',
};

const getSubjectLabel = (subject: string): string => SUBJECT_LABELS[subject] ?? subject;

interface ConfigPermissionsDialogProps {
  role: ForceRoleDTO | null;
  permissions: PermissionItem[];
  mappings: RolePermissionMapping[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

/** 配置权限弹窗：按 subject 分组 Accordion + Checkbox，保存时 diff 后调 batchUpdateRoleMappings */
export function ConfigPermissionsDialog({
  role,
  permissions,
  mappings,
  open,
  onOpenChange,
  onRefresh,
}: ConfigPermissionsDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  /** 按 subject 分组的权限点位 */
  const grouped = useMemo(() => {
    const map = new Map<string, PermissionItem[]>();
    permissions.forEach((p: PermissionItem) => {
      const list = map.get(p.subject) ?? [];
      list.push(p);
      map.set(p.subject, list);
    });
    return map;
  }, [permissions]);

  /** 当前角色已绑定的权限点位 ID 集合 */
  const initialIds = useMemo(
    () =>
      new Set(
        mappings
          .filter((m: RolePermissionMapping) => m.roleKey === role?.bizID)
          .map((m: RolePermissionMapping) => m.permissionId),
      ),
    [mappings, role],
  );

  /** 弹窗打开时以最新映射重置勾选状态 */
  useEffect(() => {
    if (open) setSelectedIds(new Set(initialIds));
  }, [open, initialIds]);

  /** 有已勾选权限的 Subject 默认展开 */
  const defaultExpanded = useMemo(
    () =>
      Array.from(grouped.keys()).filter((subject: string) =>
        (grouped.get(subject) ?? []).some((p: PermissionItem) => initialIds.has(p.id)),
      ),
    [grouped, initialIds],
  );

  const handleToggle = (id: string, checked: boolean): void => {
    setSelectedIds((prev: Set<string>) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  /** 对比初始/当前状态算 diff，提交 { roleKey, add, remove } */
  const handleSave = async (): Promise<void> => {
    if (!role?.bizID) return;
    const add = Array.from(selectedIds).filter((id: string) => !initialIds.has(id));
    const remove = Array.from(initialIds).filter((id: string) => !selectedIds.has(id));
    if (add.length === 0 && remove.length === 0) {
      onOpenChange(false);
      return;
    }
    setSaving(true);
    try {
      await batchUpdateRoleMappings({ roleKey: role.bizID, add, remove });
      toast.success('权限配置已更新');
      onOpenChange(false);
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存权限配置失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>配置权限 - {role?.name}</DialogTitle>
          <DialogDescription>勾选后保存将替换当前权限。</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <Accordion type="multiple" defaultValue={defaultExpanded}>
            {Array.from(grouped.entries()).map(([subject, perms]) => {
              const enabledCount = perms.filter((p: PermissionItem) => selectedIds.has(p.id)).length;
              const allSelected = enabledCount === perms.length;
              return (
                <AccordionItem key={subject} value={subject}>
                  <div className="flex items-center gap-2 px-3">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked: boolean | 'indeterminate') => {
                        const ids = perms.map((p: PermissionItem) => p.id);
                        setSelectedIds((prev: Set<string>) => {
                          const without = new Set(
                            [...prev].filter((id: string) => !ids.includes(id)),
                          );
                          if (checked === true) {
                            ids.forEach((id: string) => without.add(id));
                          }
                          return without;
                        });
                      }}
                      onClick={(e: MouseEvent<HTMLElement>) => e.stopPropagation()}
                      aria-label={`全选 ${getSubjectLabel(subject)}`}
                    />
                    <AccordionTrigger className="flex-1 py-2 text-sm">
                      {getSubjectLabel(subject)} ({enabledCount}/{perms.length})
                    </AccordionTrigger>
                  </div>
                  <AccordionContent className="rounded-b-md bg-muted/50 px-3">
                    {perms.map((p: PermissionItem) => (
                      <label
                        key={p.id}
                        className="flex cursor-pointer items-center gap-2 py-1.5"
                      >
                        <Checkbox
                          checked={selectedIds.has(p.id)}
                          onCheckedChange={(checked: boolean | 'indeterminate') =>
                            handleToggle(p.id, checked === true)
                          }
                        />
                        <span className="text-sm">
                          {p.description || `${p.action}:${p.subject}`}
                        </span>
                        <code className="text-xs text-muted-foreground">
                          {p.action}:{p.subject}
                        </code>
                      </label>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button disabled={saving} onClick={() => void handleSave()}>
            {saving ? '保存中…' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
