import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from 'shared/src/types/database'
import type { ItemCategoryDTO } from 'shared/src/types/dto'
import { SupabaseService } from '../supabase/supabase.service'
import { UNIQUE_VIOLATION_CODE } from 'shared/src/constants/database'

@Injectable()
export class ItemCategoriesService {
  private readonly supabase: SupabaseClient<Database>

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.client
  }

  /**
   * Fetches all item categories from the database and maps them to ItemCategoryDTO[]
   * - Returns 404 if there are no categories (per implementation plan)
   */
  async listAll(): Promise<ItemCategoryDTO[]> {
    try {
      const { data, error } = await this.supabase
        .from('item_categories')
        .select('id, name, display_name, is_required')
        .order('display_name', { ascending: true })

      if (error) {
        throw new InternalServerErrorException('Failed to fetch item categories')
      }

      if (!data || data.length === 0) {
        throw new NotFoundException('No item categories found')
      }

      return data as ItemCategoryDTO[]
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof InternalServerErrorException) {
        throw err
      }
      throw new InternalServerErrorException('Unexpected error while listing item categories')
    }
  }

  /**
   * Admin: Create a new item category
   */
  async createCategory(payload: {
    name: string
    display_name: string
    is_required?: boolean
  }): Promise<ItemCategoryDTO> {
    const name = payload.name?.trim()
    const displayName = payload.display_name?.trim()
    const isRequired = payload.is_required ?? false

    if (!name || !displayName) {
      throw new BadRequestException('name and display_name are required')
    }

    // Pre-check uniqueness (case-insensitive)
    const { data: existing, error: existError } = await this.supabase
      .from('item_categories')
      .select('id')
      .ilike('name', name)
      .maybeSingle()

    if (existError) {
      throw new InternalServerErrorException('Failed to check existing categories')
    }

    if (existing) {
      throw new ConflictException(`Category with name '${name}' already exists`)
    }

    const { data, error } = await this.supabase
      .from('item_categories')
      .insert({ name, display_name: displayName, is_required: isRequired })
      .select('id, name, display_name, is_required')
      .single()

    if (error) {
      const errorCode = error?.code

      if (errorCode === UNIQUE_VIOLATION_CODE) {
        throw new ConflictException(`Category with name '${name}' already exists`)
      }
      throw new InternalServerErrorException('Failed to create item category')
    }

    return data as ItemCategoryDTO
  }

  /**
   * Admin: Update an existing item category by id
   */
  async updateCategory(
    id: string,
    payload: Partial<{ name: string; display_name: string; is_required: boolean }>,
  ): Promise<ItemCategoryDTO> {
    // Ensure record exists
    const { data: existing, error: fetchErr } = await this.supabase
      .from('item_categories')
      .select('id, name')
      .eq('id', id)
      .single()

    if (fetchErr || !existing) {
      throw new NotFoundException(`Item category with id ${id} not found`)
    }

    const updateData: Record<string, any> = {}

    if (typeof payload.name === 'string') {
      const name = payload.name.trim()
      if (!name) {
        throw new BadRequestException('name cannot be empty')
      }
      // If changing name, ensure uniqueness
      if (name !== existing.name) {
        const { data: nameTaken, error: checkErr } = await this.supabase
          .from('item_categories')
          .select('id')
          .ilike('name', name)
          .maybeSingle()
        if (checkErr) {
          throw new InternalServerErrorException('Failed to validate name uniqueness')
        }
        if (nameTaken) {
          throw new ConflictException(`Category with name '${name}' already exists`)
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

    if (typeof payload.is_required === 'boolean') {
      updateData.is_required = payload.is_required
    }

    if (Object.keys(updateData).length === 0) {
      // no-op update; return current row
      const { data } = await this.supabase
        .from('item_categories')
        .select('id, name, display_name, is_required')
        .eq('id', id)
        .single()
      return data as ItemCategoryDTO
    }

    const { data, error } = await this.supabase
      .from('item_categories')
      .update(updateData)
      .eq('id', id)
      .select('id, name, display_name, is_required')
      .single()

    if (error) {
      const errorCode = error?.code

      if (errorCode === UNIQUE_VIOLATION_CODE) {
        throw new ConflictException('Category name already exists')
      }
      throw new InternalServerErrorException('Failed to update item category')
    }

    return data as ItemCategoryDTO
  }
}
