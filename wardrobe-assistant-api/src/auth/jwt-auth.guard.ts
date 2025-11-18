import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import type { Request as ExpressRequest } from 'express'

/**
 * JwtAuthGuard validates the Bearer token using Supabase Auth and
 * attaches the authenticated user to request.user.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ headers: ExpressRequest['headers']; user?: any }>()

    const authHeader = req.headers?.authorization || req.headers?.Authorization
    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException('Missing Authorization header')
    }

    const [scheme, token] = authHeader.split(' ')
    if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header format. Expected: Bearer <token>')
    }

    const { data, error } = await this.supabase.client.auth.getUser(token)
    if (error || !data?.user) {
      throw new UnauthorizedException('Invalid or expired token')
    }

    // Attach the authenticated user to the request
    req.user = data.user

    return true
  }
}
