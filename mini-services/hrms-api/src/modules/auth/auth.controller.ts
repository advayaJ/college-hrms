import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common'
import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { LoginDto, SwitchRoleDto, ChangePasswordDto } from './dto'
import { Public } from '../../core/auth/decorators'
import { CurrentUser } from '../../core/auth/current-user.decorator'
import { SessionUser, AUTH_COOKIE } from '../../core/auth/auth.types'
import { ok } from '../../core/http/envelope'

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const ip = (req.headers['x-forwarded-for']?.toString() || req.socket?.remoteAddress || '').slice(0, 60)
    const deviceLabel = (req.headers['user-agent'] || 'unknown device').toString().slice(0, 120)
    const { token, view } = await this.auth.login(dto.email, dto.password, ip, deviceLabel)
    res.cookie(AUTH_COOKIE, token, this.auth.cookieOptions())
    return ok(view)
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response, @CurrentUser() user?: SessionUser) {
    const token = this.rawToken(req)
    await this.auth.logout(user?.userId ?? null, this.auth.decode(token)?.jti)
    res.clearCookie(AUTH_COOKIE, { path: '/' })
    return ok({ signedOut: true })
  }

  @Get('me')
  async me(@CurrentUser() user: SessionUser, @Req() req: Request) {
    const payload = this.auth.decode(this.rawToken(req))
    return ok(await this.auth.sessionView(user.userId, payload ?? undefined))
  }

  @Post('switch-role')
  async switchRole(
    @CurrentUser() user: SessionUser,
    @Body() dto: SwitchRoleDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const { token: newToken, view } = await this.auth.switchRole(user.userId, dto.roleKey, this.rawToken(req))
    res.cookie(AUTH_COOKIE, newToken, this.auth.cookieOptions())
    return ok(view)
  }

  @Public()
  @Get('demo-accounts')
  async demoAccounts() {
    return ok(await this.auth.demoAccounts())
  }

  @Get('sessions')
  async sessions(@CurrentUser() user: SessionUser) {
    return ok(await this.auth.mySessions(user.userId))
  }

  @Post('sessions/:id/revoke')
  async revokeSession(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return ok(await this.auth.revokeSession(user.userId, id))
  }

  @Post('change-password')
  async changePassword(@CurrentUser() user: SessionUser, @Body() dto: ChangePasswordDto) {
    return ok(await this.auth.changePassword(user.userId, dto.currentPassword, dto.newPassword))
  }

  private rawToken(req: Request): string {
    const cookie = (req.cookies || {})[AUTH_COOKIE]
    if (cookie) return cookie
    const header = req.headers['authorization']?.toString() || ''
    return header.startsWith('Bearer ') ? header.slice(7) : ''
  }
}
