import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { MoreHorizontal, Pencil, Plus, Settings2, Trash2 } from 'lucide-react';
import { Table, type TableColumnsType } from '@client/src/components/ui/data-table';
import { Badge } from '@client/src/components/ui/badge';
import { Button } from '@client/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@client/src/components/ui/dropdown-menu';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@client/src/components/ui/hover-card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@client/src/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@client/src/components/ui/alert-dialog';
import {
  deleteRole,
  getRoles,
  listPermissions,
  listRoleMappings,
} from '@client/src/api/roleManager';
import { MemberSummary } from './MemberSummary';
import { EditMembersDialog } from './EditMembersDialog';
import { ConfigPermissionsDialog } from './ConfigPermissionsDialog';
import { RoleFormDialog } from './RoleFormDialog';
import type {
  ForceRoleDTO,
  PermissionItem,
  RolePermissionMapping,
} from '@shared/api.interface';

/** 权限点位列的展示上限 */
const MAX_PERMISSION_DISPLAY = 3;

/** 含企业全员/互联网公开的角色不可删除 */
const canDeleteRole = (role: ForceRoleDTO): boolean => {
  const rm = role.roleMembers;
  return !(rm?.allEmployees || rm?.public);
};

/** 权限点位描述文案（无 description 时退化为 action:subject） */
const permissionLabel = (p: PermissionItem): string =>
  p.description || `${p.action}:${p.subject}`;

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<ForceRoleDTO[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [mappings, setMappings] = useState<RolePermissionMapping[]>([]);
  const [loading, setLoading] = useState(true); // 仅用于首次加载

  const [formOpen, setFormOpen] = useState(false);
  const [formRole, setFormRole] = useState<ForceRoleDTO | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [membersRole, setMembersRole] = useState<ForceRoleDTO | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [configRole, setConfigRole] = useState<ForceRoleDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ForceRoleDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  /** 刷新列表时不设 loading=true，避免表格闪烁 */
  const loadData = async (isInitial = false): Promise<void> => {
    if (isInitial) setLoading(true);
    try {
      const [rolesData, permsData, mapsData] = await Promise.all([
        getRoles(),
        listPermissions(),
        listRoleMappings(),
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
      setMappings(mapsData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '加载角色列表失败');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    void loadData(true);
  }, []);

  const handleDelete = async (): Promise<void> => {
    if (!deleteTarget?.bizID) return;
    setDeleting(true);
    try {
      await deleteRole(deleteTarget.bizID);
      toast.success('角色已删除');
      setDeleteTarget(null);
      void loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除角色失败');
    } finally {
      setDeleting(false);
    }
  };

  /** 「权限点位」列摘要：description Badge + action:subject 置灰小字，溢出用 HoverCard */
  const PermissionSummary = ({ role }: { role: ForceRoleDTO }) => {
    const bound = mappings
      .filter((m: RolePermissionMapping) => m.roleKey === role.bizID)
      .map((m: RolePermissionMapping) =>
        permissions.find((p: PermissionItem) => p.id === m.permissionId),
      )
      .filter((p: PermissionItem | undefined): p is PermissionItem => p !== undefined);
    if (bound.length === 0) {
      return <span className="text-muted-foreground">--</span>;
    }
    const visible = bound.slice(0, MAX_PERMISSION_DISPLAY);
    const overflowCount = bound.length - visible.length;
    return (
      <div className="flex flex-col gap-1">
        {visible.map((p: PermissionItem) => (
          <div key={p.id} className="flex items-center gap-1.5">
            <Badge variant="secondary" className="font-normal">
              {permissionLabel(p)}
            </Badge>
            <code className="text-xs text-muted-foreground">
              {p.action}:{p.subject}
            </code>
          </div>
        ))}
        {overflowCount > 0 && (
          <HoverCard openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
              <Badge variant="outline" className="w-fit cursor-pointer">
                +{overflowCount}
              </Badge>
            </HoverCardTrigger>
            <HoverCardContent className="w-auto max-w-[360px] p-2">
              <div className="flex flex-col gap-1">
                {bound.slice(MAX_PERMISSION_DISPLAY).map((p: PermissionItem) => (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="font-normal">
                      {permissionLabel(p)}
                    </Badge>
                    <code className="text-xs text-muted-foreground">
                      {p.action}:{p.subject}
                    </code>
                  </div>
                ))}
              </div>
            </HoverCardContent>
          </HoverCard>
        )}
      </div>
    );
  };

  const columns: TableColumnsType<ForceRoleDTO> = [
    {
      title: '角色名称',
      dataIndex: 'name',
      width: 160,
      render: (text: string | undefined) => (
        <span className="font-medium">{text || '--'}</span>
      ),
    },
    {
      title: '角色描述',
      dataIndex: 'description',
      width: 220,
      render: (text: string | undefined) => (
        <span className="text-muted-foreground">{text || '--'}</span>
      ),
    },
    {
      title: '角色标识',
      dataIndex: 'bizID',
      width: 170,
      render: (text: string | undefined) => (
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{text || '--'}</code>
      ),
    },
    {
      title: '权限点位',
      key: 'permissions',
      width: 260,
      render: (_: unknown, record: ForceRoleDTO) => <PermissionSummary role={record} />,
    },
    {
      title: '角色成员',
      key: 'members',
      width: 260,
      render: (_: unknown, record: ForceRoleDTO) => <MemberSummary role={record} />,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: unknown, record: ForceRoleDTO) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-primary"
            onClick={() => {
              setMembersRole(record);
              setMembersOpen(true);
            }}
          >
            编辑成员
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">更多操作</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => {
                  setConfigRole(record);
                  setConfigOpen(true);
                }}
              >
                <Settings2 className="size-4" />
                配置权限
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setFormRole(record);
                  setFormOpen(true);
                }}
              >
                <Pencil className="size-4" />
                编辑角色信息
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canDeleteRole(record) ? (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setDeleteTarget(record)}
                >
                  <Trash2 className="size-4" />
                  删除角色
                </DropdownMenuItem>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="block w-full cursor-not-allowed">
                      <DropdownMenuItem disabled className="text-destructive">
                        <Trash2 className="size-4" />
                        删除角色
                      </DropdownMenuItem>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>包含企业全员/互联网公开的角色不支持删除</TooltipContent>
                </Tooltip>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-6">
      {/* 标题区 + 顶部「添加角色」按钮 */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">角色与权限管理</h1>
          <p className="text-sm text-muted-foreground">
            管理应用内的角色、成员构成与权限点位分配。
          </p>
        </div>
        <Button
          onClick={() => {
            setFormRole(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          添加角色
        </Button>
      </div>

      {/* 角色表格（必须用 Table 组件） */}
      <div
        data-ai-section-type="card-list"
        className="rounded-xl border bg-card p-6 shadow-sm"
      >
        <Table
          columns={columns}
          dataSource={roles}
          loading={loading}
          rowKey="bizID"
          bordered
          pagination={{
            showSizeChanger: true,
            showTotal: (total: number) => `共 ${total} 条`,
            pageSizeOptions: [5, 10, 20],
          }}
          scroll={{ x: 1300 }}
        />
      </div>

      {/* 创建/编辑角色信息弹窗 */}
      <RoleFormDialog
        open={formOpen}
        role={formRole}
        onOpenChange={(next: boolean) => setFormOpen(next)}
        onSuccess={() => void loadData()}
      />

      {/* 编辑成员弹窗 */}
      {membersRole && (
        <EditMembersDialog
          role={membersRole}
          open={membersOpen}
          onOpenChange={(next: boolean) => setMembersOpen(next)}
          onSuccess={() => void loadData()}
        />
      )}

      {/* 配置权限弹窗 */}
      {configRole && (
        <ConfigPermissionsDialog
          key={configRole.bizID}
          role={configRole}
          permissions={permissions}
          mappings={mappings}
          open={configOpen}
          onOpenChange={(next: boolean) => setConfigOpen(next)}
          onRefresh={() => void loadData()}
        />
      )}

      {/* 删除角色二次确认 */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(next: boolean) => {
          if (!next) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除角色？</AlertDialogTitle>
            <AlertDialogDescription>
              将删除角色「{deleteTarget?.name}」（{deleteTarget?.bizID}
              ），该操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? '删除中…' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
