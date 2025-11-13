import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from 'shared/src/types/database'

@Injectable()
export class AdminService {
  private adminClient: SupabaseClient<Database>

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL') || ''
    const serviceRoleKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (!url || !serviceRoleKey) {
      throw new InternalServerErrorException(
        'Supabase admin configuration missing. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.',
      )
    }

    this.adminClient = createClient<Database>(url, serviceRoleKey)
  }

  async createUser(email: string, password: string) {
    // Supabase admin API for creating a user
    const { data, error } = await this.adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error) {
      // Translate common errors to meaningful messages
      const msg = error.message || 'Failed to create user'
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('already registered')) {
        throw new BadRequestException('User with this email already exists')
      }
      throw new InternalServerErrorException(msg)
    }

    return {
      id: data.user?.id,
      email: data.user?.email,
    }
  }
}
