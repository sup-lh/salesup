import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Inbox, Plus, Search, Trash2, Users } from 'lucide-react';
import { Table, type TableColumnsType } from '@client/src/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { newcomer as newcomerApi } from '@/api';
import type { NewcomerListQuery, NewcomerSummary } from '@shared/api.interface';
import {
  NEWCOMER_ASSESSMENT_STATUS_OPTIONS,
  NEWCOMER_STAGE_OPTIONS,
} from './newcomer-options';
import { NewcomerCreateDialog } from './NewcomerCreateDialog';
import { UserDisplay } from '@/components/business-ui/user-display';
import NewcomerApplicationDialog from './NewcomerApplicationDialog';
import AssessmentDialog from './AssessmentDialog';
import NewcomerDetailSheet from './NewcomerDetailSheet';

const PAGE_SIZE = 20;

const STATUS_BADGE_CLASS: Record<NewcomerSummary['status'], string> = {
  在培: 'bg-primary/10 text-primary',
  已转正: 'bg-success text-white',
  已离职: 'bg-secondary text-muted-foreground',
};

/** 新人总表页面：筛选 + 列表 + 新建 / 考核 / 详情 */
const NewcomersPage = () => {
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [stage, setStage] = useState<NewcomerListQuery['stage']>('');
  const [assessmentStatus, setAssessmentStatus] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<NewcomerSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [assessmentTarget, setAssessmentTarget] = useState<NewcomerSummary | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NewcomerSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 搜索防抖：300ms 后触发刷新并回到第一页
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(keywordInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await newcomerApi.fetchNewcomers({
        keyword,
        stage,
        assessmentStatus,
        offset: (page - 1) * PAGE_SIZE,
        pageSize: PAGE_SIZE,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch {
      toast.error('获取新人列表失败');
    } finally {
      setLoading(false);
    }
  }, [keyword, stage, assessmentStatus, page]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleStageChange = (value: string) => {
    if (value === 'all') {
      setStage('');
    } else {
      const option = NEWCOMER_STAGE_OPTIONS.find((o) => o.value === value);
      setStage(option ? option.value : '');
    }
    setPage(1);
  };

  const handleAssessmentStatusChange = (value: string) => {
    if (value === 'all') {
      setAssessmentStatus('');
    } else {
      const option = NEWCOMER_ASSESSMENT_STATUS_OPTIONS.find((o) => o.value === value);
      setAssessmentStatus(option ? option.value : '');
    }
    setPage(1);
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await newcomerApi.deleteNewcomer(deleteTarget.id);
      toast.success(`已删除「${deleteTarget.name}」的档案及关联成长记录`);
      setDeleteTarget(null);
      void fetchData();
    } catch {
      toast.error('删除失败，请稍后重试');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, fetchData]);

  const columns: TableColumnsType<NewcomerSummary> = useMemo(
    () => [
      {
        title: '姓名',
        dataIndex: 'name',
        fixed: 'left',
        width: 160,
        render: (_: unknown, record: NewcomerSummary) => (
          <div className="flex items-center gap-2">
            {record.userId ? (
              <UserDisplay userId={record.userId} size="small" />
            ) : (
              <span className="font-medium text-foreground">{record.name}</span>
            )}
            {record.assessmentStatus === '90天考核通过' ? (
                <Badge className="rounded-full bg-success text-white">
                可转正
              </Badge>
            ) : null}
          </div>
        ),
      },
      { title: '岗位', dataIndex: 'position', width: 110 },
      { title: '入职日期', dataIndex: 'hireDate', width: 120 },
      {
        title: '带教师傅',
        dataIndex: 'mentorId',
        width: 140,
        render: (_: unknown, record: NewcomerSummary) =>
          record.mentorId ? (
            <UserDisplay userId={record.mentorId} size="small" />
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        title: '当前阶段',
        dataIndex: 'stage',
        width: 150,
        render: (_: unknown, record: NewcomerSummary) => (
          <span className="text-foreground">
            {record.stage}
            <span className="ml-1 text-xs text-muted-foreground">
              第 {record.dayCount} 天
            </span>
          </span>
        ),
      },
      {
        title: '闯关进度',
        dataIndex: 'challengeProgress',
        width: 160,
        render: (_: unknown, record: NewcomerSummary) => (
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${record.challengeProgress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {record.challengeProgress}%
            </span>
          </div>
        ),
      },
      {
        title: '通关状态',
        dataIndex: 'passSummary',
        width: 180,
        render: (_: unknown, record: NewcomerSummary) => (
          <span
            className={
              record.passSummary === '暂未通关'
                ? 'text-xs text-muted-foreground'
                : 'text-xs font-medium text-primary'
            }
          >
            {record.passSummary}
          </span>
        ),
      },
      {
        title: '考核状态',
        dataIndex: 'assessmentStatus',
        width: 150,
        render: (_: unknown, record: NewcomerSummary) => (
          <div className="flex items-center gap-2">
            {record.assessmentStatus === '待考核' ? (
              <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-accent" />
            ) : null}
            <span className="text-sm text-foreground">{record.assessmentStatus}</span>
          </div>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 90,
        render: (_: unknown, record: NewcomerSummary) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_CLASS[record.status]}`}
          >
            {record.status}
          </span>
        ),
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right',
        width: 250,
        render: (_: unknown, record: NewcomerSummary) => (
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailId(record.id)}
            >
              详情
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary"
              onClick={() => setAssessmentTarget(record)}
            >
              节点考核
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteTarget(record)}
            >
              <Trash2 className="h-4 w-4" />
              删除
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">新人管理</h1>
            <p className="text-sm text-muted-foreground">新人档案与节点考核</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-ai-section-type="button"
            variant="outline"
            onClick={() => setApplicationOpen(true)}
          >
            <Inbox className="mr-1 h-4 w-4" />
            新人申请
          </Button>
          <Button data-ai-section-type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            新建新人
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder="搜索姓名"
            className="pl-9"
          />
        </div>
        <Select
          value={stage || 'all'}
          onValueChange={(value) => handleStageChange(value)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="全部阶段" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部阶段</SelectItem>
            {NEWCOMER_STAGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={assessmentStatus || 'all'}
          onValueChange={(value) => handleAssessmentStatusChange(value)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="全部考核状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部考核状态</SelectItem>
            {NEWCOMER_ASSESSMENT_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">共 {total} 位新人</span>
      </div>

      <div
        data-ai-section-type="card-list"
        className="rounded-xl border bg-card p-6 shadow-sm"
      >
        <Table
          columns={columns}
          dataSource={items}
          loading={loading}
          rowKey="id"
          bordered
          scroll={{ x: 1200, y: 500 }}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total,
            showSizeChanger: true,
            showTotal: (total: number) => `共 ${total} 条`,
            pageSizeOptions: [5, 10, 20],
            onChange: (nextPage: number) => setPage(nextPage),
          }}
        />
      </div>

      <NewcomerCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setPage(1);
          void fetchData();
        }}
      />

      <NewcomerApplicationDialog
        open={applicationOpen}
        onOpenChange={setApplicationOpen}
        onApproved={() => {
          setPage(1);
          void fetchData();
        }}
      />

      <AssessmentDialog
        open={assessmentTarget !== null}
        onOpenChange={(open) => {
          if (!open) setAssessmentTarget(null);
        }}
        newcomer={assessmentTarget}
        onSubmitted={() => void fetchData()}
      />

      <NewcomerDetailSheet
        newcomerId={detailId}
        open={detailId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
        onChanged={() => void fetchData()}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除新人档案？</AlertDialogTitle>
            <AlertDialogDescription>
              将删除「{deleteTarget?.name}」的档案及其全部关联成长记录（闯关打卡、课程学习、考核、带教与复盘），操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
            >
              {deleting ? '删除中…' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NewcomersPage;
