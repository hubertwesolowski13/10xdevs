import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtAuthGuard } from './jwt-auth.guard'

/**
 * Guard that allows access if either:
 * - x-admin-secret header matches SUPABASE_SERVICE_ROLE_KEY (admin path), or
 * - a valid Bearer JWT is provided (user path).
 */
@Injectable()
export class JwtOrAdminGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly jwtGuard: JwtAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, any> }>()

    const provided = (req.headers?.['x-admin-secret'] || req.headers?.['X-Admin-Secret']) as string | undefined
    const expected = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')

    // Allow with admin secret if configured and matches
    if (provided && expected && provided === expected) {
      return true
    }

    // Fallback to JWT guard
    try {
      return await this.jwtGuard.canActivate(context)
    } catch {
      // Normalize to Unauthorized if neither admin nor jwt is present/valid
      throw new UnauthorizedException('Unauthorized: missing or invalid credentials')
    }
  }
}
