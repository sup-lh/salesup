import type { ReactNode } from 'react';
import { Building, Globe, Users } from 'lucide-react';

/**
 * 特殊成员图标背景色，跟随品牌色（CSS 变量 --primary），默认蓝色。
 * 抽为常量方便全局统一修改。
 */
const SPECIAL_ICON_BG = 'bg-primary';

const BrandCircleIcon = ({ children }: { children: ReactNode }) => (
  <span
    className={`flex items-center justify-center rounded-full ${SPECIAL_ICON_BG}`}
    style={{ width: 20, height: 20 }}
  >
    {children}
  </span>
);

/** 特殊成员范围图标（品牌色圆底 20px + lucide 白色图标），表格和成员面板中复用 */
export const SPECIAL_MEMBER_ICONS = {
  allEmployees: (
    <BrandCircleIcon>
      <Building className="h-3 w-3 text-primary-foreground" />
    </BrandCircleIcon>
  ),
  public: (
    <BrandCircleIcon>
      <Globe className="h-3 w-3 text-primary-foreground" />
    </BrandCircleIcon>
  ),
  appDeveloper: (
    <BrandCircleIcon>
      <Users className="h-3 w-3 text-primary-foreground" />
    </BrandCircleIcon>
  ),
};
