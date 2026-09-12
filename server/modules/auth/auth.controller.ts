import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';

import { AUTH_COOKIE_NAME, AUTH_SESSION_DAYS } from '@server/common/auth/auth.constants';
import { NeedLogin } from '@server/common/auth/auth.decorators';
import type { IndependentRequest } from '@server/common/auth/auth.types';
import { AuthService } from './auth.service';

interface LoginBody {
  username?: string;
  password?: string;
}

interface ChangePasswordBody {
  currentPassword?: string;
  newPassword?: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginBody, @Res({ passthrough: true }) response: Response) {
    if (!body.username || !body.password) {
      throw new UnauthorizedException('请输入用户名和密码');
    }
    const result = await this.authService.login(body.username, body.password);
    response.cookie(AUTH_COOKIE_NAME, result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: AUTH_SESSION_DAYS * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return { user: result.user };
  }

  @Post('logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const token = request.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(AUTH_COOKIE_NAME + '='))
      ?.slice(AUTH_COOKIE_NAME.length + 1);
    if (token) await this.authService.logout(decodeURIComponent(token), (request as IndependentRequest).independentUserContext?.userId);
    response.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
    return { ok: true };
  }

  @NeedLogin()
  @Get('me')
  me(@Req() request: IndependentRequest) {
    return request.independentUserContext;
  }

  @NeedLogin()
  @Post('change-password')
  async changePassword(@Req() request: IndependentRequest, @Body() body: ChangePasswordBody) {
    if (!body.newPassword || body.newPassword.length < 10 || !/[A-Za-z]/.test(body.newPassword) || !/\d/.test(body.newPassword)) {
      throw new UnauthorizedException('新密码至少 10 位且必须包含字母和数字');
    }
    const token = request.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(AUTH_COOKIE_NAME + '='))
      ?.slice(AUTH_COOKIE_NAME.length + 1);
    return this.authService.changePassword(
      request.independentUserContext!.userId,
      body.currentPassword,
      body.newPassword,
      token ? decodeURIComponent(token) : undefined,
    );
  }
}
