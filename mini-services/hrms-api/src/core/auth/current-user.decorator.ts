import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { SessionUser } from './auth.types'

export const CurrentUser = createParamDecorator(
  (data: keyof SessionUser | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest()
    const user: SessionUser | undefined = req.user
    return data ? user?.[data] : user
  }
)
