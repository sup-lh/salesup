import { useEffect, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@client/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import { Textarea } from '@client/src/components/ui/textarea';
import { createRole, updateRole } from '@client/src/api/roleManager';
import type { ForceRoleDTO } from '@shared/api.interface';

/** bizID 约束：snake_case（小写字母开头，仅小写字母/数字/下划线） */
const BIZ_ID_PATTERN = /^[a-z][a-z0-9_]*$/;

interface RoleFormDialogProps {
  open: boolean;
  /** null 表示创建模式，否则为编辑既有角色 */
  role: ForceRoleDTO | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/** 创建/编辑角色信息弹窗（名称 / bizID / 描述，编辑时 bizID 只读） */
export function RoleFormDialog({ open, role, onOpenChange, onSuccess }: RoleFormDialogProps) {
  const isEdit = role !== null;
  const [name, setName] = useState('');
  const [bizID, setBizID] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(role?.name ?? '');
    setBizID(role?.bizID ?? '');
    setDescription(role?.description ?? '');
    setSaving(false);
  }, [open, role]);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setName(e.target.value);
  };

  const handleBizIDChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setBizID(e.target.value);
  };

  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setDescription(e.target.value);
  };

  const handleSave = async (): Promise<void> => {
    const trimmedName = name.trim();
    const trimmedBizID = bizID.trim();
    if (!trimmedName) {
      toast.error('请填写角色名称');
      return;
    }
    if (!isEdit) {
      if (!trimmedBizID) {
        toast.error('请填写角色标识');
        return;
      }
      if (!BIZ_ID_PATTERN.test(trimmedBizID)) {
        toast.error('角色标识需为 snake_case 格式（小写字母、数字、下划线）');
        return;
      }
    }
    setSaving(true);
    try {
      if (isEdit && role?.bizID) {
        await updateRole(role.bizID, {
          role: { name: trimmedName, description: description.trim() },
        });
        toast.success('角色信息已更新');
      } else {
        await createRole({
          role: {
            name: trimmedName,
            bizID: trimmedBizID,
            description: description.trim() || undefined,
          },
        });
        toast.success('角色创建成功');
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存角色信息失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑角色信息' : '添加角色'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '更新角色的名称与描述，角色标识不可修改。' : '创建一个新角色，创建后可在表格中配置成员与权限。'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-name">角色名称</Label>
            <Input
              id="role-name"
              value={name}
              onChange={handleNameChange}
              placeholder="如：新人导师"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-biz-id">角色标识（bizID）</Label>
            <Input
              id="role-biz-id"
              value={bizID}
              disabled={isEdit}
              onChange={handleBizIDChange}
              placeholder="snake_case 格式，如 role_mentor"
            />
            <p className="text-xs text-muted-foreground">
              {isEdit
                ? '角色标识创建后不可修改'
                : '仅支持小写字母、数字、下划线，如 role_mentor'}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-description">角色描述</Label>
            <Textarea
              id="role-description"
              rows={3}
              value={description}
              onChange={handleDescriptionChange}
              placeholder="选填，说明角色用途"
            />
          </div>
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
