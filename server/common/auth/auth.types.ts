export interface UserContext {
  userId: string;
  username: string;
  displayName: string;
  roleKeys: string[];
  permissions: Array<{ action: string; subject: string }>;
  mustChangePassword: boolean;
}

import type { Request } from 'express';

export type IndependentRequest = Request & {
  independentUserContext?: UserContext;
  /** Compatibility bridge for legacy services that still read req.userContext. */
  userContext?: UserContext;
};

declare module 'express-serve-static-core' {
  interface Request {
    userContext?: UserContext;
    __platform_data__?: Record<string, unknown>;
  }
}
