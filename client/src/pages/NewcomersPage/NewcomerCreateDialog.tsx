import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserSelect } from '@/components/business-ui/user-select';
import { newcomer as newcomerApi } from '@/api';
import { getApiErrorMessage } from '@client/src/utils/api-error';
import type { CreateNewcomerByUserRequest } from '@shared/api.interface';
import { NEWCOMER_POSITION_OPTIONS } from './newcomer-options';
import { NewcomerDatePicker } from './NewcomerDatePicker';

const createNewcomerSchema = z.object({
  name: z.string(),
  userId: z.string().nullable(),
  position: z.string().min(1, '请选择岗位'),
  hireDate: z.string().min(1, '请选择入职日期'),
  mentorId: z.string().nullable(),
  goalContract: z.string(),
});

type CreateNewcomerFormData = z.infer<typeof createNewcomerSchema>;

interface NewcomerCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  /** 为 true 时将新档案关联到当前登录账号（工作台导入入口使用） */
  bindToCurrentAccount?: boolean;
  /** 为 true 时提交入职申请而非直接建档（申请人由后端从登录态写入） */
  applicationMode?: boolean;
}

/** 「新建新人」弹窗表单 */
export function NewcomerCreateDialog({
  open,
  onOpenChange,
  onCreated,
  bindToCurrentAccount = false,
  applicationMode = false,
}: NewcomerCreateDialogProps) {
  const useSelfNameField = bindToCurrentAccount;
  const useUserSelect = !bindToCurrentAccount && !applicationMode;
  const form = useForm<CreateNewcomerFormData>({
    resolver: zodResolver(createNewcomerSchema),
    defaultValues: { name: '', userId: null, position: '销售顾问', hireDate: '', mentorId: null, goalContract: '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: '', userId: null, position: '销售顾问', hireDate: '', mentorId: null, goalContract: '' });
    }
  }, [open, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    const positionOption = NEWCOMER_POSITION_OPTIONS.find((p) => p.value === data.position);
    if (!positionOption) return;
    if (useSelfNameField && data.name.trim() === '') {
      form.setError('name', { message: '姓名不能为空' });
      return;
    }
    if (useUserSelect && !data.userId) {
      form.setError('userId', { message: '请选择人员' });
      return;
    }

    try {
      if (applicationMode) {
        await newcomerApi.submitNewcomerApplication({
          position: positionOption.value,
          hireDate: data.hireDate,
          goalContract: data.goalContract.trim() || undefined,
        });
        toast.success('申请已提交，请等待管理员审核');
      } else if (bindToCurrentAccount) {
        await newcomerApi.createNewcomer({
          name: data.name.trim(),
          position: positionOption.value,
          hireDate: data.hireDate,
          mentorId: data.mentorId ?? undefined,
          goalContract: data.goalContract.trim() || undefined,
          bindToCurrentAccount: true,
        });
        toast.success(`已导入「${data.name.trim()}」的档案并关联当前账号`);
      } else {
        const request: CreateNewcomerByUserRequest = {
          userId: data.userId ?? '',
          position: positionOption.value,
          hireDate: data.hireDate,
        };
        if (data.mentorId) request.mentorId = data.mentorId;
        if (data.goalContract.trim()) request.goalContract = data.goalContract.trim();
        const result = await newcomerApi.createNewcomerAdmin(request);
        logger.info('按人员新建新人成功', result);
        toast.success(
          `已添加「${result.name}」为销售新人，其登录后即可看到自己的工作台`,
        );
      }
      onCreated();
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, '新建新人失败，请稍后重试'));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {applicationMode
              ? '提交入职申请'
              : bindToCurrentAccount
                ? '导入我的新人档案'
                : '新建新人档案'}
          </DialogTitle>
          <DialogDescription>
            {applicationMode
              ? '填写基础信息提交申请，管理员审核通过后将自动建立你的新人档案。'
              : bindToCurrentAccount
                ? '录入基础信息后，档案将关联当前账号，并自动生成闯关任务清单。'
                : '从人员清单中选择销售新人，档案将绑定其账号，其登录后即可看到自己的工作台。'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              {useSelfNameField ? (
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        姓名 <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="请输入姓名" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
              {useUserSelect ? (
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        人员 <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <UserSelect
                          value={field.value}
                          onChange={(value) => field.onChange(value ?? null)}
                          placeholder="请选择销售新人"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      岗位 <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="请选择岗位" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NEWCOMER_POSITION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="hireDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      入职日期 <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <NewcomerDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="请选择入职日期"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!applicationMode ? (
                <FormField
                  control={form.control}
                  name="mentorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>带教师傅</FormLabel>
                      <FormControl>
                        <UserSelect
                          value={field.value}
                          onChange={(value) => field.onChange(value ?? null)}
                          placeholder="请选择带教师傅"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </div>
            <FormField
              control={form.control}
              name="goalContract"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>目标契约</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="填写培养目标与约定，例如：90 天内完成产品知识通关并独立跟单 3 个商机"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {applicationMode ? '提交申请' : '创建档案'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default NewcomerCreateDialog;
