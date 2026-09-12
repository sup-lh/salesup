import { listUsersByIds } from '@client/src/components/business-ui/api/users/service';

export type AccountType = 'local' | 'apaas';
export interface UserProfileData { name?: string; avatar?: string; email?: string; userStatus: number; userType: '_employee' }

export async function fetchUserProfile(userId: string, _accountType: AccountType = 'local', _signal?: AbortSignal): Promise<{ useLarkCard: false; userProfileInfo: UserProfileData }> {
  const response = await listUsersByIds([userId]);
  const user = response.data.userInfoMap[userId];
  return {
    useLarkCard: false,
    userProfileInfo: {
      name: user?.name.zh_cn,
      avatar: user?.avatar?.image.large,
      email: user?.email,
      userStatus: user ? 2 : 0,
      userType: '_employee',
    },
  };
}

export function getAssetsUrl(path: string): string { return path; }
