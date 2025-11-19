import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from 'shared/src/types/database'
import type { StyleDTO } from 'shared/src/types/dto'
import { SupabaseService } from '../supabase/supabase.service'
import { UNIQUE_VIOLATION_CODE } from 'shared/src/constants/database'

@Injectable()
export class StylesService {
  private readonly supabase: SupabaseClient<Database>

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.client
  }

  /**
   * Fetches all styles from the database and maps them to StyleDTO[]
   * - Returns 404 if there are no styles (per implementation plan)
   */
  async listAll(): Promise<StyleDTO[]> {
    try {
      const { data, error } = await this.supabase
        .from('styles')
        .select('id, name, display_name')
        .order('display_name', { ascending: true })

      if (error) {
        throw new InternalServerErrorException('Failed to fetch styles')
      }

      if (!data || data.length === 0) {
        throw new NotFoundException('No styles found')
      }

      return data as StyleDTO[]
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof InternalServerErrorException) {
        throw err
      }
      throw new InternalServerErrorException('Unexpected error while listing styles')
    }
  }

  /**
   * Admin: Create a new style
   */
  async createStyle(payload: { name: string; display_name: string }): Promise<StyleDTO> {
    const name = payload.name?.trim()
    const displayName = payload.display_name?.trim()

    if (!name || !displayName) {
      throw new BadRequestException('name and display_name are required')
    }

    const { data: existing, error: existError } = await this.supabase
      .from('styles')
      .select('id')
      .ilike('name', name)
      .maybeSingle()

    if (existError) {
      throw new InternalServerErrorException('Failed to check existing styles')
    }

    if (existing) {
      throw new ConflictException(`Style with name '${name}' already exists`)
    }

    const { data, error } = await this.supabase
      .from('styles')
      .insert({ name, display_name: displayName })
      .select('id, name, display_name')
      .single()

    if (error) {
      const errorCode = error?.code

      if (errorCode === UNIQUE_VIOLATION_CODE) {
        throw new ConflictException(`Style with name '${name}' already exists`)
      }
      throw new InternalServerErrorException('Failed to create style')
    }

    return data as StyleDTO
  }

  /**
   * Admin: Update an existing style by id
   */
  async updateStyle(id: string, payload: Partial<{ name: string; display_name: string }>): Promise<StyleDTO> {
    const { data: existing, error: fetchErr } = await this.supabase
      .from('styles')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchErr || !existing) {
      throw new NotFoundException(`Style with id ${id} not found`)
    }

    const updateData: Record<string, any> = {}

    if (typeof payload.name === 'string') {
      const name = payload.name.trim()
      if (!name) {
        throw new BadRequestException('name cannot be empty')
      }
      if (name !== existing.name) {
        const { data: nameTaken, error: checkErr } = await this.supabase
          .from('styles')
          .select('id')
          .ilike('name', name)
          .maybeSingle()
        if (checkErr) {
          throw new InternalServerErrorException('Failed to validate name uniqueness')
        }
        if (nameTaken) {
          throw new ConflictException(`Style with name '${name}' already exists`)
        }
      }
      updateData.name = name
    }

    if (typeof payload.display_name === 'string') {
      const display = payload.display_name.trim()
      if (!display) {
        throw new BadRequestException('display_name cannot be empty')
      }
      updateData.display_name = display
    }

    if (Object.keys(updateData).length === 0) {
      const { data } = await this.supabase.from('styles').select('id, name, display_name').eq('id', id).single()
      return data as StyleDTO
    }

    const { data, error } = await this.supabase
      .from('styles')
      .update(updateData)
      .eq('id', id)
      .select('id, name, display_name')
      .single()

    if (error) {
      const errorCode = error?.code

      if (errorCode === UNIQUE_VIOLATION_CODE) {
        throw new ConflictException('Style name already exists')
      }
      throw new InternalServerErrorException('Failed to update style')
    }

    return data as StyleDTO
  }
}
