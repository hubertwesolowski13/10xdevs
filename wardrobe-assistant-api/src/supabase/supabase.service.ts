import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from 'shared/src/types/database'

/**
 * Centralized Supabase client service.
 * - Validates required environment variables at construction time
 * - Exposes a typed Supabase client for database access
 */
@Injectable()
export class SupabaseService {
  public readonly client: SupabaseClient<Database>

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL') || ''
    const key = this.config.get<string>('SUPABASE_KEY') || ''

    if (!url || !key) {
      // Fail early with a clear message — easier to diagnose misconfiguration
      throw new InternalServerErrorException(
        'Supabase configuration missing. Ensure SUPABASE_URL and SUPABASE_KEY are set in the environment/.env',
      )
    }

    this.client = createClient<Database>(url, key)
  }
}
