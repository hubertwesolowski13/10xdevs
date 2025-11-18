import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { ProfileDTO, UpdateProfileCommand } from 'shared/src/types/dto'
import { SupabaseService } from '../supabase/supabase.service'

@Injectable()
export class ProfilesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  /** Determine if the request carries a valid admin secret header */
  private isAdmin(headers: Record<string, any> | undefined): boolean {
    if (!headers) return false
    const provided = (headers['x-admin-secret'] || headers['X-Admin-Secret']) as string | undefined
    const expected = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')
    return Boolean(provided && expected && provided === expected)
  }

  /** Fetch a profile by user id with authorization check (self or admin) */
  async getProfileById(
    targetUserId: string,
    requesterId: string | null,
    headers?: Record<string, any>,
  ): Promise<ProfileDTO> {
    const admin = this.isAdmin(headers)

    // Authorization: requester must be the owner or admin
    if (!admin) {
      if (!requesterId) {
        throw new ForbiddenException('Access to this profile is forbidden')
      }
      if (requesterId !== targetUserId) {
        throw new ForbiddenException('You can only access your own profile')
      }
    }

    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('id, username, created_at, updated_at')
      .eq('id', targetUserId)
      .maybeSingle()

    if (error) {
      throw new InternalServerErrorException('Failed to fetch profile')
    }

    if (!data) {
      throw new NotFoundException('Profile not found')
    }

    return data as ProfileDTO
  }

  /** Update profile fields with validation and authorization checks */
  async updateProfile(
    targetUserId: string,
    payload: UpdateProfileCommand,
    requesterId: string | null,
    headers?: Record<string, any>,
  ): Promise<ProfileDTO> {
    const admin = this.isAdmin(headers)

    if (!admin) {
      if (!requesterId) {
        throw new ForbiddenException('Access to this profile is forbidden')
      }
      if (requesterId !== targetUserId) {
        throw new ForbiddenException('You can only update your own profile')
      }
    }

    // Validate payload is not empty
    if (!payload || Object.keys(payload).length === 0) {
      throw new BadRequestException('No fields provided for update')
    }

    // If username provided, validate its uniqueness (excluding current user)
    if (payload.username) {
      const username = payload.username.trim()
      if (username.length < 3 || username.length > 30) {
        throw new BadRequestException('username must be between 3 and 30 characters')
      }
      if (!/^[A-Za-z0-9_]+$/.test(username)) {
        throw new BadRequestException('username can only contain letters, numbers and underscores')
      }

      const { data: existing, error: existsError } = await this.supabase.client
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', targetUserId)
        .limit(1)
        .maybeSingle()

      if (existsError) {
        throw new InternalServerErrorException('Failed to validate username uniqueness')
      }
      if (existing) {
        throw new BadRequestException('Username is already taken')
      }
    }

    const { data, error } = await this.supabase.client
      .from('profiles')
      .update(payload)
      .eq('id', targetUserId)
      .select('id, username, created_at, updated_at')
      .maybeSingle()

    if (error) {
      throw new InternalServerErrorException('Failed to update profile')
    }

    if (!data) {
      throw new NotFoundException('Profile not found')
    }

    return data as ProfileDTO
  }
}
