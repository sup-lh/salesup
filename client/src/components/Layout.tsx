import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Home,
  ClipboardCheck,
  Award,
  BarChart3,
  ListTodo,
  Users,
  Settings,
  BookOpen,
  BookText,
  LibraryBig,
  Layers,
  Shield,
  ClipboardList,
  MessageSquare,
  LogOut,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem } from '@/components/ui/breadcrumb';
import { Can, useAuth, useCurrentUserProfile } from '@/auth/AuthProvider';
import { Image } from '@client/src/components/ui/image';

type NavItem = {
  path: string;
  title: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: { action: string; subject: string };
};

type NavGroupDef = {
  label: string;
  items: NavItem[];
};

/** 导航组 — 新人侧（按业务域分二级分组） */
const NAV_GROUPS: NavGroupDef[] = [
  {
    label: '日常工作',
    items: [
      { path: '/', title: '新人工作台', label: '新人工作台', icon: Home },
      { path: '/my-tasks', title: '我的任务', label: '我的任务', icon: ClipboardCheck },
    ],
  },
  {
    label: '学习考核',
    items: [
      { path: '/course', title: '考核中心', label: '考核中心', icon: BookText },
      {
        path: '/knowledge-base',
        title: '销售知识库',
        label: '销售知识库',
        icon: BookOpen,
        permission: { action: 'read', subject: 'KnowledgeBase' },
      },
    ],
  },
  {
    label: '成长辅导',
    items: [
      { path: '/coaching', title: '带教复盘', label: '带教复盘', icon: MessageSquare },
      { path: '/defense', title: '转正面试', label: '转正面试', icon: Award },
    ],
  },
];

/** 管理组 — 管理侧（按功能域分二级分组） */
const ADMIN_GROUPS: NavGroupDef[] = [
  {
    label: '数据与人员',
    items: [
      {
        path: '/dashboard',
        title: '数据看板',
        label: '数据看板',
        icon: BarChart3,
        permission: { action: 'read', subject: 'Dashboard' },
      },
      {
        path: '/newcomers',
        title: '人员清单',
        label: '人员清单',
        icon: Users,
        permission: { action: 'manage', subject: 'Newcomer' },
      },
    ],
  },
  {
    label: '内容管理',
    items: [
      {
        path: '/task-management',
        title: '任务管理',
        label: '任务管理',
        icon: ListTodo,
        permission: { action: 'manage', subject: 'Task' },
      },
      {
        path: '/stage-management',
        title: '阶段配置',
        label: '阶段配置',
        icon: Layers,
        permission: { action: 'manage', subject: 'Newcomer' },
      },
      {
        path: '/course-admin',
        title: '课程管理',
        label: '课程管理',
        icon: BookText,
        permission: { action: 'manage', subject: 'Newcomer' },
      },
      {
        path: '/quiz-admin',
        title: '考题管理',
        label: '考题管理',
        icon: ClipboardList,
        permission: { action: 'manage', subject: 'Newcomer' },
      },
      {
        path: '/knowledge-base-admin',
        title: '知识库管理',
        label: '知识库管理',
        icon: LibraryBig,
        permission: { action: 'manage', subject: 'KnowledgeBase' },
      },
    ],
  },
  {
    label: '系统管理',
    items: [
      {
        path: '/admin-management',
        title: '管理员管理',
        label: '管理员管理',
        icon: Shield,
        permission: { action: 'manage', subject: 'Permission' },
      },
      {
        path: '/system-settings',
        title: '系统配置',
        label: '系统配置',
        icon: Settings,
        permission: { action: 'manage', subject: 'Permission' },
      },
      {
        path: '/defense-admin',
        title: '转正面试',
        label: '转正面试',
        icon: Award,
        permission: { action: 'manage', subject: 'Newcomer' },
      },
    ],
  },
];

/** 拍平后用于顶部面包屑标题查找 */
const ALL_VISIBLE_NAV: NavItem[] = [
  ...NAV_GROUPS.flatMap((g) => g.items),
  ...ADMIN_GROUPS.flatMap((g) => g.items),
];

const NavSection = ({
  sectionLabel,
  groups,
  pathname,
}: {
  sectionLabel: string;
  groups: NavGroupDef[];
  pathname: string;
}) => (
  <SidebarGroup>
    <SidebarGroupLabel className="px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-sidebar-foreground/40">
      {sectionLabel}
    </SidebarGroupLabel>
    <SidebarGroupContent className="space-y-3 group-data-[collapsible=icon]:space-y-1">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-3 text-[10px] font-medium uppercase tracking-[0.06em] text-sidebar-foreground/30 group-data-[collapsible=icon]:hidden">
            {group.label}
          </p>
          <SidebarMenu className="gap-0.5">
            {group.items.map((item) => {
              const isActive = pathname === item.path;
              const content = (
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className={
                    isActive
                      ? 'bg-sidebar-accent/60 font-medium text-sidebar-foreground shadow-sm'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground/95'
                  }
                >
                  <Link to={item.path}>
                    <item.icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              );
              return (
                <SidebarMenuItem key={item.path}>
                  {item.permission ? (
                    <Can
                      action={item.permission.action}
                      subject={item.permission.subject}
                      fallback={null}
                    >
                      {content}
                    </Can>
                  ) : (
                    content
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </div>
      ))}
    </SidebarGroupContent>
  </SidebarGroup>
);

const LayoutContent = () => {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const userInfo = useCurrentUserProfile();
  const activeItem = ALL_VISIBLE_NAV.find(
    (item: NavItem) => pathname === item.path,
  );
  const activeTitle = activeItem?.title ?? '新人工作台';
  const isLoggedIn = Boolean(userInfo?.user_id);

  return (
    <>
      <Sidebar collapsible="icon">
        {/* 品牌区域 — 简练深色标识 */}
        <SidebarHeader className="border-b border-sidebar-border/60 pb-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <span className="text-sm font-bold">S</span>
                  </div>
                  <div className="flex flex-col gap-0 leading-none">
                    <span className="text-sm font-semibold tracking-tight">SalesUp</span>
                    <span className="text-[11px] text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
                      新人成长系统
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="py-3">
          <NavSection sectionLabel="导航" groups={NAV_GROUPS} pathname={pathname} />
          <Can action="read" subject="Dashboard" fallback={null}>
            <NavSection sectionLabel="管理" groups={ADMIN_GROUPS} pathname={pathname} />
          </Can>
        </SidebarContent>

        {/* 用户信息 — 沉底轻量展示 */}
        <SidebarFooter className="border-t border-sidebar-border/60 pt-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="hover:bg-sidebar-accent/40">
                <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-sidebar-accent/50">
                  {isLoggedIn && userInfo?.avatar ? (
                    <Image src={userInfo.avatar} alt={userInfo.name} className="size-7 object-cover" />
                  ) : (
                    <span className="text-[11px] font-medium text-sidebar-foreground/60">
                      {isLoggedIn && userInfo?.name ? userInfo.name.slice(-2) : '--'}
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-0 leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-medium text-sidebar-foreground/90">
                    {isLoggedIn && userInfo?.name ? userInfo.name : '游客'}
                  </span>
                  <span className="truncate text-[11px] text-sidebar-foreground/40">
                    {isLoggedIn && userInfo?.email ? userInfo.email : ''}
                  </span>
                </div>
                <button type="button" title="退出登录" aria-label="退出登录" onClick={() => void logout()} className="ml-auto grid size-7 place-items-center rounded-md text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                  <LogOut className="size-4" />
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* 主内容区 */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-sm">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <div className="h-4 w-px bg-border" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="text-sm font-medium text-foreground/80">
                {activeTitle}
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </>
  );
};

const Layout = () => (
  <SidebarProvider>
    <LayoutContent />
  </SidebarProvider>
);

export default Layout;
