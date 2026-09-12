import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request as ExpressRequest, Response } from 'express';

import { AUTH_COOKIE_NAME } from './auth.constants';
import { AuthService } from '../../modules/auth/auth.service';
import type { IndependentRequest } from './auth.types';

function getCookie(request: ExpressRequest, name: string): string | undefined {
  const header = request.headers.cookie;
  if (!header) return undefined;
  const prefix = name + '=';
  const match = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : undefined;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(request: IndependentRequest, _response: Response, next: NextFunction) {
    const token = getCookie(request, AUTH_COOKIE_NAME);
    if (token) {
      const user = await this.authService.resolveSession(token);
      request.independentUserContext = user;
      request.userContext = user;
    }
    next();
  }
}
