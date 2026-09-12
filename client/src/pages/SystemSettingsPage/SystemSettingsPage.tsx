import { ShieldCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@client/src/components/ui/tabs';
import RoleManagementPage from '../RoleManagementPage/RoleManagementPage';

/** 系统配置设置项定义（未来可在此扩展更多 tab） */
const SETTINGS_TABS = [
  {
    value: 'role-permission',
    label: '角色权限',
    icon: ShieldCheck,
  },
] as const;

const SystemSettingsPage: React.FC = () => {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-6">
      {/* 页头 */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">系统配置</h1>
        <p className="text-sm text-muted-foreground">
          管理系统角色、权限和基础配置
        </p>
      </div>

      {/* 设置项 Tabs */}
      <Tabs defaultValue={SETTINGS_TABS[0].value} className="space-y-4">
        <TabsList>
          {SETTINGS_TABS.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value}>
                <TabIcon className="size-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="role-permission">
          {/* 复用已有的角色权限管理页作为 Tab 内容 */}
          <RoleManagementPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemSettingsPage;
