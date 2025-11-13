import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

/**
 * Simple header-based admin guard.
 *
 * Protect endpoints by attaching @UseGuards(AdminGuard) and sending the header:
 *   x-admin-secret: <SUPABASE_SERVICE_ROLE_KEY>
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { headers: Record<string, string | undefined> }>()
    const provided = (request.headers['x-admin-secret'] || (request.headers['X-Admin-Secret'] as any)) as
      | string
      | undefined

    if (!provided) {
      throw new UnauthorizedException('Missing x-admin-secret header')
    }

    const expected = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')
    if (!expected) {
      throw new ForbiddenException('Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY is not set')
    }

    if (provided !== expected) {
      throw new ForbiddenException('Invalid admin secret')
    }

    return true
  }
}
