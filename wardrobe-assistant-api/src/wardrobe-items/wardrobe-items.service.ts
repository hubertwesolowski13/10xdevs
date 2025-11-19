import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from 'shared/src/types/database'
import type { WardrobeItemDTO } from 'shared/src/types/dto'
import { SupabaseService } from '../supabase/supabase.service'
import type { ListWardrobeItemsQuery } from './dto/list-wardrobe-items.query'

@Injectable()
export class WardrobeItemsService {
  private readonly supabase: SupabaseClient<Database>

  constructor(private readonly supabaseService: SupabaseService) {
    this.supabase = this.supabaseService.client
  }

  /**
   * List authenticated user's wardrobe items with pagination, filtering and sorting
   */
  async list(userId: string, query: ListWardrobeItemsQuery): Promise<WardrobeItemDTO[]> {
    try {
      const page = query.page ?? 1
      const limit = query.limit ?? 20
      const from = (page - 1) * limit
      const to = from + limit - 1

      let builder = this.supabase
        .from('wardrobe_items')
        .select('id, user_id, category_id, name, color, brand, created_at, updated_at')
        .eq('user_id', userId)

      if (query.category_id) {
        builder = builder.eq('category_id', query.category_id)
      }
      if (query.color) {
        builder = builder.ilike('color', `%${query.color}%`)
      }
      if (query.brand) {
        builder = builder.ilike('brand', `%${query.brand}%`)
      }

      builder = builder.order(query.sort_by ?? 'created_at', { ascending: (query.order ?? 'desc') === 'asc' })
      builder = builder.range(from, to)

      const { data, error } = await builder

      if (error) {
        throw new InternalServerErrorException('Failed to fetch wardrobe items')
      }

      // With RLS and filters, empty list is a valid 200 response
      return (data ?? []) as WardrobeItemDTO[]
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof InternalServerErrorException) {
        throw err
      }
      throw new InternalServerErrorException('Unexpected error while listing wardrobe items')
    }
  }

  /** Create a new wardrobe item for the authenticated user */
  async create(
    userId: string,
    payload: Partial<Pick<WardrobeItemDTO, 'category_id' | 'name' | 'color' | 'brand'>>,
  ): Promise<WardrobeItemDTO> {
    const categoryId = payload.category_id
    const name = payload.name?.trim()
    const color = payload.color?.trim()
    const brand = payload.brand?.trim() ?? null

    if (!categoryId || !name || !color) {
      throw new BadRequestException('category_id, name and color are required')
    }

    const { data, error } = await this.supabase
      .from('wardrobe_items')
      .insert({ user_id: userId, category_id: categoryId, name, color, brand })
      .select('id, user_id, category_id, name, color, brand, created_at, updated_at')
      .single()

    if (error) {
      // Could be FK violation for category_id or other DB issues
      throw new InternalServerErrorException('Failed to create wardrobe item')
    }

    return data as WardrobeItemDTO
  }

  /** Partially update an existing wardrobe item owned by the user */
  async update(
    userId: string,
    itemId: string,
    partial: Partial<Pick<WardrobeItemDTO, 'category_id' | 'name' | 'color' | 'brand'>>,
  ): Promise<WardrobeItemDTO> {
    // Make sure item exists and belongs to user (defense-in-depth in addition to RLS)
    const { data: existing, error: fetchErr } = await this.supabase
      .from('wardrobe_items')
      .select('id, user_id')
      .eq('id', itemId)
      .single()

    if (fetchErr || !existing) {
      throw new NotFoundException(`Wardrobe item with id ${itemId} not found`)
    }
    if (existing.user_id !== userId) {
      // RLS will also block, but return a clear message
      throw new NotFoundException(`Wardrobe item with id ${itemId} not found`)
    }

    const updateData: Record<string, any> = {}
    if (typeof partial.category_id === 'string') updateData.category_id = partial.category_id
    if (typeof partial.name === 'string') updateData.name = partial.name.trim()
    if (typeof partial.color === 'string') updateData.color = partial.color.trim()
    if (typeof partial.brand === 'string') updateData.brand = partial.brand.trim()

    if (Object.keys(updateData).length === 0) {
      const { data } = await this.supabase
        .from('wardrobe_items')
        .select('id, user_id, category_id, name, color, brand, created_at, updated_at')
        .eq('id', itemId)
        .single()
      return data as WardrobeItemDTO
    }

    const { data, error } = await this.supabase
      .from('wardrobe_items')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .eq('user_id', userId)
      .select('id, user_id, category_id, name, color, brand, created_at, updated_at')
      .single()

    if (error) {
      throw new InternalServerErrorException('Failed to update wardrobe item')
    }

    if (!data) {
      // If RLS prevented update or item not found for user
      throw new NotFoundException(`Wardrobe item with id ${itemId} not found`)
    }

    return data as WardrobeItemDTO
  }

  /** Delete a wardrobe item owned by the user */
  async remove(userId: string, itemId: string): Promise<void> {
    // Ensure exists and belongs to user
    const { data: existing, error: fetchErr } = await this.supabase
      .from('wardrobe_items')
      .select('id, user_id')
      .eq('id', itemId)
      .single()

    if (fetchErr || !existing) {
      throw new NotFoundException(`Wardrobe item with id ${itemId} not found`)
    }
    if (existing.user_id !== userId) {
      throw new NotFoundException(`Wardrobe item with id ${itemId} not found`)
    }

    const { error } = await this.supabase.from('wardrobe_items').delete().eq('id', itemId).eq('user_id', userId)

    if (error) {
      throw new InternalServerErrorException('Failed to delete wardrobe item')
    }
  }
}
