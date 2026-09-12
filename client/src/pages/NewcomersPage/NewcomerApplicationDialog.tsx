import React, { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { UserDisplay } from '@/components/business-ui/user-display';
import { newcomer as newcomerApi } from '@/api';
import { getApiErrorMessage } from '@client/src/utils/api-error';
import type { NewcomerApplicationItem } from '@shared/api.interface';

const APPLICATION_STATUS_META: Record<
  NewcomerApplicationItem['status'],
  { label: string; className: string }
> = {
  pending: { label: '待处理', className: 'bg-[hsl(38_92%_50%)] text-white' },
  approved: { label: '已通过', className: 'bg-[hsl(152_60%_42%)] text-white' },
  rejected: { label: '已拒绝', className: 'bg-destructive text-white' },
};

const formatDateTime = (value: string): string =>
  dayjs(value).format('YYYY-MM-DD HH:mm');

interface ApplicationRowProps {
  item: NewcomerApplicationItem;
  approving: boolean;
  onApprove: (applicationId: string) => void;
  onReject: (item: NewcomerApplicationItem) => void;
}

const ApplicationRow: React.FC<ApplicationRowProps> = ({
  item,
  approving,
  onApprove,
  onReject,
}) => {
  const statusMeta = APPLICATION_STATUS_META[item.status];
  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <UserDisplay userId={item.userId} size="small" />
          <span className="text-sm text-muted-foreground">· {item.position}</span>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusMeta.className}`}
        >
          {statusMeta.label}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
        <span>入职日期：{item.hireDate}</span>
        <span>提交时间：{formatDateTime(item.createdAt)}</span>
      </div>
      {item.goalContract ? (
        <p className="truncate text-sm text-muted-foreground">
          目标契约：<span className="text-foreground">{item.goalContract}</span>
        </p>
      ) : null}
      {item.status === 'rejected' && item.reviewComment ? (
        <p className="text-sm text-destructive">拒绝理由：{item.reviewComment}</p>
      ) : null}
      {item.status === 'pending' ? (
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            disabled={approving}
            onClick={() => onApprove(item.id)}
          >
            {approving ? '通过中…' : '通过'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onReject(item)}>
            拒绝
          </Button>
        </div>
      ) : null}
    </div>
  );
};

interface NewcomerApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApproved: () => void;
}

/** 「新人申请」处理弹窗：展示全部入职申请，pending 行可通过 / 拒绝 */
export const NewcomerApplicationDialog: React.FC<
  NewcomerApplicationDialogProps
> = ({ open, onOpenChange, onApproved }) => {
  const [items, setItems] = useState<NewcomerApplicationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<NewcomerApplicationItem | null>(
    null,
  );
  const [rejectComment, setRejectComment] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const result = await newcomerApi.fetchNewcomerApplications();
      setItems(result.items);
    } catch (error) {
      setFailed(true);
      toast.error(getApiErrorMessage(error, '获取入职申请列表失败'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void fetchApplications();
    }
  }, [open, fetchApplications]);

  const handleApprove = useCallback(
    async (applicationId: string) => {
      setApprovingId(applicationId);
      try {
        await newcomerApi.approveNewcomerApplication(applicationId);
        toast.success('已通过并录入新人档案');
        await fetchApplications();
        onApproved();
      } catch (error) {
        toast.error(getApiErrorMessage(error, '通过申请失败，请稍后重试'));
      } finally {
        setApprovingId(null);
      }
    },
    [fetchApplications, onApproved],
  );

  const handleReject = useCallback((item: NewcomerApplicationItem) => {
    setRejectComment('');
    setRejectTarget(item);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await newcomerApi.rejectNewcomerApplication(
        rejectTarget.id,
        rejectComment.trim() || undefined,
      );
      toast.success('已拒绝该入职申请');
      setRejectTarget(null);
      setRejectComment('');
      await fetchApplications();
    } catch (error) {
      toast.error(getApiErrorMessage(error, '拒绝申请失败，请稍后重试'));
    } finally {
      setRejecting(false);
    }
  }, [rejectTarget, rejectComment, fetchApplications]);

  const renderBody = () => {
    if (loading) {
      return <p className="py-8 text-center text-sm text-muted-foreground">加载中…</p>;
    }
    if (failed) {
      return (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-sm text-muted-foreground">申请列表加载失败</p>
          <Button variant="outline" size="sm" onClick={() => void fetchApplications()}>
            <RefreshCw className="size-4" />
            重试
          </Button>
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <p className="py-8 text-center text-sm text-muted-foreground">暂无入职申请</p>
      );
    }
    return (
      <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
        {items.map((item: NewcomerApplicationItem) => (
          <ApplicationRow
            key={item.id}
            item={item}
            approving={approvingId === item.id}
            onApprove={(applicationId) => void handleApprove(applicationId)}
            onReject={handleReject}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>新人入职申请</DialogTitle>
            <DialogDescription>
              审核新人提交的入职申请，通过后将自动录入新人档案并生成闯关任务。
            </DialogDescription>
          </DialogHeader>
          {renderBody()}
        </DialogContent>
      </Dialog>
      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setRejectTarget(null);
            setRejectComment('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>拒绝入职申请</DialogTitle>
            <DialogDescription>
              拒绝「{rejectTarget?.name}」的入职申请，理由将展示给申请人（可不填）。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">拒绝理由</p>
            <Textarea
              rows={3}
              value={rejectComment}
              onChange={(event) => setRejectComment(event.target.value)}
              placeholder="请输入拒绝理由"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={rejecting}
              onClick={() => {
                setRejectTarget(null);
                setRejectComment('');
              }}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              disabled={rejecting}
              onClick={() => void handleConfirmReject()}
            >
              {rejecting ? '提交中…' : '确认拒绝'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewcomerApplicationDialog;
