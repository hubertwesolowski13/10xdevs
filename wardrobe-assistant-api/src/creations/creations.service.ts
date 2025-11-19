import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from 'shared/src/types/database'
import type {
  CreationDTO,
  WardrobeItemDTO,
  CreateCreationCommand,
  CreationItemDTO,
  AddWardrobeItemToCreationCommand,
} from 'shared/src/types/dto'
import { SupabaseService } from '../supabase/supabase.service'
import { UNIQUE_VIOLATION_CODE } from 'shared/src/constants/database'

/**
 * Service responsible for handling creation generation and acceptance logic.
 * Includes wardrobe verification, mock AI generation, and database operations.
 */
@Injectable()
export class CreationsService {
  private supabase: SupabaseClient<Database>

  constructor(private readonly supabaseService: SupabaseService) {
    // Use the injected Supabase client via DI for testability and consistency
    this.supabase = this.supabaseService.client
  }

  /**
   * Lists creations for the authenticated user with optional filters and pagination.
   *
   * - Always filters by user_id
   * - Optional filters: status, style_id, search (name ilike)
   * - Sorting: sort_by + order (default created_at desc)
   * - Pagination: page, limit using Supabase range
   */
  async list(
    userId: string,
    query: {
      page?: number
      limit?: number
      status?: string
      style_id?: string
      search?: string
      sort_by?: 'created_at' | 'updated_at' | 'name' | 'status'
      order?: 'asc' | 'desc'
    },
  ): Promise<CreationDTO[]> {
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const sortBy = query.sort_by ?? 'created_at'
    const order = query.order ?? 'desc'

    const from = (page - 1) * limit
    const to = from + limit - 1

    try {
      let builder = this.supabase
        .from('creations')
        .select('id, name, image_path, style_id, status, created_at, updated_at, user_id')
        .eq('user_id', userId)

      if (query.status) {
        builder = builder.eq('status', query.status)
      }
      if (query.style_id) {
        builder = builder.eq('style_id', query.style_id)
      }
      if (query.search) {
        builder = builder.ilike('name', `%${query.search}%`)
      }

      // sorting
      builder = builder.order(sortBy, { ascending: order === 'asc' })

      // pagination
      const { data, error } = await builder.range(from, to)

      if (error) {
        throw new InternalServerErrorException('Failed to list creations')
      }

      return (data ?? []) as unknown as CreationDTO[]
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error
      }
      throw new InternalServerErrorException('An error occurred while listing creations')
    }
  }

  /**
   * Lists wardrobe items linked to a given creation owned by the authenticated user.
   *
   * Steps:
   * - Verify creation exists and belongs to the user (404 if not)
   * - Select from public.creation_items filtered by creation_id
   * - Return list of CreationItemDTO
   */
  async listCreationItems(
    creationId: string,
    userId: string,
    query?: { page?: number; limit?: number; expand?: 'item'; includeTotal?: boolean },
  ): Promise<
    | CreationItemDTO[]
    | (CreationItemDTO & { item: WardrobeItemDTO })[]
    | {
        items: CreationItemDTO[] | (CreationItemDTO & { item: WardrobeItemDTO })[]
        total: number
      }
  > {
    // Early validation handled at controller level via ParseUUIDPipe.
    try {
      // 1) Ensure the creation exists and belongs to the user
      const { data: creation, error: creationError } = await this.supabase
        .from('creations')
        .select('id, user_id')
        .eq('id', creationId)
        .eq('user_id', userId)
        .maybeSingle()

      if (creationError) {
        throw new InternalServerErrorException('Failed to verify creation ownership')
      }

      if (!creation) {
        throw new NotFoundException('Creation not found')
      }

      // 2) Fetch linked items with optional pagination
      const page = query?.page ?? 1
      const limit = query?.limit ?? 20
      const from = (page - 1) * limit
      const to = from + limit - 1

      const builder = this.supabase
        .from('creation_items')
        .select('id, creation_id, item_id', { count: query?.includeTotal ? 'exact' : undefined })
        .eq('creation_id', creationId)

      const { data, error, count } = await builder.range(from, to)

      if (error) {
        throw new InternalServerErrorException('Failed to list creation items')
      }

      const items = (data ?? []) as unknown as CreationItemDTO[]

      // 3) Optionally expand wardrobe item details
      if (query?.expand === 'item' && items.length > 0) {
        const itemIds = items.map((ci) => ci.item_id)
        const { data: wardrobeItems, error: itemsError } = await this.supabase
          .from('wardrobe_items')
          .select('id, category_id, name, color, brand, created_at, updated_at, user_id')
          .in('id', itemIds)
          .eq('user_id', userId)

        if (itemsError) {
          throw new InternalServerErrorException('Failed to expand wardrobe items')
        }

        const byId = new Map<string, WardrobeItemDTO>(
          (wardrobeItems ?? []).map((wi) => [wi.id, wi as unknown as WardrobeItemDTO]),
        )
        const expanded = items.map((ci) => ({
          ...ci,
          item: byId.get(ci.item_id) as WardrobeItemDTO,
        }))

        if (query?.includeTotal) {
          return { items: expanded, total: count ?? expanded.length }
        }
        return expanded
      }

      if (query?.includeTotal) {
        return { items, total: count ?? items.length }
      }
      return items
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error
      }
      throw new InternalServerErrorException('An error occurred while listing creation items')
    }
  }

  /**
   * Creates an association between a creation and a wardrobe item for the authenticated user.
   *
   * Steps:
   * - Validate the creation exists and belongs to the user
   * - Validate the wardrobe item exists and belongs to the user
   * - Validate relation via DB function can_add_to_creation (403 if false)
   * - Insert into public.creation_items (handle unique violation as conflict)
   * - Return inserted CreationItemDTO
   */
  async addWardrobeItemToCreation(
    creationId: string,
    command: AddWardrobeItemToCreationCommand,
    userId: string,
  ): Promise<CreationItemDTO> {
    const { item_id } = command

    try {
      // 1) Ensure the creation exists and belongs to the user
      const { data: creation, error: creationError } = await this.supabase
        .from('creations')
        .select('id, user_id')
        .eq('id', creationId)
        .eq('user_id', userId)
        .maybeSingle()

      if (creationError) {
        throw new InternalServerErrorException('Failed to verify creation ownership')
      }
      if (!creation) {
        throw new NotFoundException('Creation not found')
      }

      // 2) Ensure the wardrobe item exists and belongs to the user
      const { data: item, error: itemError } = await this.supabase
        .from('wardrobe_items')
        .select('id, user_id')
        .eq('id', item_id)
        .eq('user_id', userId)
        .maybeSingle()

      if (itemError) {
        throw new InternalServerErrorException('Failed to verify wardrobe item ownership')
      }
      if (!item) {
        throw new NotFoundException('Wardrobe item not found')
      }

      // 3) Validate via DB function can_add_to_creation
      const { data: canAdd, error: canAddError } = await this.supabase.rpc('can_add_to_creation', {
        p_creation_id: creationId,
        p_item_id: item_id,
      })

      if (canAddError) {
        throw new InternalServerErrorException('Failed to validate relation')
      }
      if (!canAdd) {
        // Business rule violation
        throw new ForbiddenException('Item cannot be added to this creation')
      }

      // 4) Insert relation
      const { data: inserted, error: insertError } = await this.supabase
        .from('creation_items')
        .insert({ creation_id: creationId, item_id })
        .select('id, creation_id, item_id')
        .single()

      if (insertError || !inserted) {
        if (insertError?.code === UNIQUE_VIOLATION_CODE) {
          throw new ConflictException('This item is already added to the creation')
        }
        throw new InternalServerErrorException('Failed to add item to creation')
      }

      return inserted as unknown as CreationItemDTO
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException
      ) {
        throw error
      }
      throw new InternalServerErrorException('An error occurred while adding item to creation')
    }
  }

  /**
   * Creates a new creation manually for the authenticated user.
   *
   * Steps:
   * - Validate style existence (404 if not found)
   * - Insert a new row into public.creations with status 'pending'
   * - Return the inserted row mapped to CreationDTO
   *
   * @param command - payload containing style_id, name, image_path
   * @param userId - authenticated user's id
   * @throws NotFoundException when style does not exist
   * @throws InternalServerErrorException on database errors
   */
  async createCreation(command: CreateCreationCommand, userId: string): Promise<CreationDTO> {
    const { style_id, name, image_path } = command

    try {
      // 0) Enforce per-user uniqueness of creation name (early guard)
      const { data: existingByName, error: existingByNameError } = await this.supabase
        .from('creations')
        .select('id')
        .eq('user_id', userId)
        .eq('name', name)
        .maybeSingle()

      if (existingByNameError) {
        // If checking duplicates fails for any reason, treat as server error
        throw new InternalServerErrorException('Failed to verify creation name uniqueness')
      }

      if (existingByName) {
        throw new ConflictException('A creation with this name already exists for the user')
      }

      // 1) Ensure style exists
      const { data: style, error: styleError } = await this.supabase
        .from('styles')
        .select('id')
        .eq('id', style_id)
        .single()

      if (styleError || !style) {
        throw new NotFoundException(`Style with id ${style_id} not found`)
      }

      // 2) Insert the creation with default status 'pending'
      const { data: inserted, error: insertError } = await this.supabase
        .from('creations')
        .insert({
          name,
          image_path,
          style_id,
          user_id: userId,
          status: 'pending',
        })
        .select('id, name, image_path, style_id, status, created_at, updated_at, user_id')
        .single()

      if (insertError || !inserted) {
        const errorCode = insertError?.code

        if (errorCode === UNIQUE_VIOLATION_CODE) {
          throw new ConflictException('A creation with this name already exists for the user')
        }
        throw new InternalServerErrorException('Failed to create the creation')
      }

      return inserted as unknown as CreationDTO
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException ||
        error instanceof ConflictException
      ) {
        throw error
      }
      throw new InternalServerErrorException('An error occurred while creating the creation')
    }
  }

  /**
   * Generates creations based on the provided style_id.
   * Verifies that the user has the required wardrobe items before generating.
   *
   * @param styleId - The UUID of the style for generation
   * @param userId - The authenticated user's ID
   * @returns Array of generated CreationDTO objects
   * @throws BadRequestException if required wardrobe items are missing
   * @throws NotFoundException if the style doesn't exist
   * @throws InternalServerErrorException for unexpected errors
   */
  async generateCreations(styleId: string, userId: string): Promise<CreationDTO[]> {
    try {
      // Step 1: Verify the style exists
      const { data: style, error: styleError } = await this.supabase
        .from('styles')
        .select('id, name, display_name')
        .eq('id', styleId)
        .single()

      console.log(styleError, style)

      if (styleError || !style) {
        throw new NotFoundException(`Style with id ${styleId} not found`)
      }

      // Step 2: Check if user has required wardrobe items
      await this.verifyRequiredWardrobeItems(userId)

      // Step 3: Get user's wardrobe items for generation
      const wardrobeItems = await this.getUserWardrobeItems(userId)

      // Step 4: Generate creations using mock AI (in development)
      const generatedCreations = await this.mockAIGeneration(styleId, userId, wardrobeItems)

      return generatedCreations
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('An error occurred while generating creations')
    }
  }

  /**
   * Accepts a generated creation by updating its status to 'accepted'.
   *
   * Business rules and validations:
   * - The creation must exist; otherwise a NotFoundException is thrown (HTTP 404).
   * - The creation must belong to the calling user; otherwise a BadRequestException is thrown (HTTP 400).
   * - On persistence/update issues an InternalServerErrorException is thrown (HTTP 500).
   * - The method updates `status` and touch `updated_at` to the current timestamp.
   *
   * @param creationId - The UUID of the creation to accept
   * @param userId - The authenticated user's ID
   * @throws NotFoundException if the creation doesn't exist
   * @throws BadRequestException if the creation doesn't belong to the user
   * @throws InternalServerErrorException if the database update fails or an unexpected error occurs
   */
  async acceptCreation(creationId: string, userId: string): Promise<void> {
    try {
      // Verify the creation exists and belongs to the user
      const { data: creation, error: fetchError } = await this.supabase
        .from('creations')
        .select('id, user_id, status')
        .eq('id', creationId)
        .single()

      if (fetchError || !creation) {
        throw new NotFoundException(`Creation with id ${creationId} not found`)
      }

      if (creation.user_id !== userId) {
        throw new BadRequestException('You do not have permission to accept this creation')
      }

      // Update the creation status to 'accepted'
      const { error: updateError } = await this.supabase
        .from('creations')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', creationId)

      if (updateError) {
        throw new InternalServerErrorException('Failed to accept the creation')
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error
      }
      throw new InternalServerErrorException('An error occurred while accepting the creation')
    }
  }

  /**
   * Rejects a generated creation by updating its status to 'rejected'.
   *
   * Business rules and validations:
   * - The creation must exist; otherwise a NotFoundException is thrown (HTTP 404).
   * - The creation must belong to the calling user; otherwise a BadRequestException is thrown (HTTP 400).
   * - On persistence/update issues an InternalServerErrorException is thrown (HTTP 500).
   * - The method updates `status` and touch `updated_at` to the current timestamp.
   *
   * @param creationId - The UUID of the creation to reject
   * @param userId - The authenticated user's ID
   * @throws NotFoundException if the creation doesn't exist
   * @throws BadRequestException if the creation doesn't belong to the user
   * @throws InternalServerErrorException if the database update fails or an unexpected error occurs
   */
  async rejectCreation(creationId: string, userId: string): Promise<void> {
    try {
      // Verify the creation exists and belongs to the user
      const { data: creation, error: fetchError } = await this.supabase
        .from('creations')
        .select('id, user_id, status')
        .eq('id', creationId)
        .single()

      if (fetchError || !creation) {
        throw new NotFoundException(`Creation with id ${creationId} not found`)
      }

      if (creation.user_id !== userId) {
        throw new BadRequestException('You do not have permission to reject this creation')
      }

      // Update the creation status to 'rejected'
      const { error: updateError } = await this.supabase
        .from('creations')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', creationId)

      if (updateError) {
        throw new InternalServerErrorException('Failed to reject the creation')
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error
      }
      throw new InternalServerErrorException('An error occurred while rejecting the creation')
    }
  }

  /**
   * Verifies that the user has all required wardrobe items.
   * Required items are determined by the item_categories table where is_required = true.
   *
   * @param userId - The user's ID
   * @throws BadRequestException if required items are missing
   */
  private async verifyRequiredWardrobeItems(userId: string): Promise<void> {
    // Get all required item categories
    const { data: requiredCategories, error: categoriesError } = await this.supabase
      .from('item_categories')
      .select('id, name, display_name')
      .eq('is_required', true)

    if (categoriesError || !requiredCategories) {
      throw new InternalServerErrorException('Failed to fetch required item categories')
    }

    // Get user's wardrobe items grouped by category
    const { data: userItems, error: itemsError } = await this.supabase
      .from('wardrobe_items')
      .select('category_id')
      .eq('user_id', userId)

    if (itemsError) {
      throw new InternalServerErrorException('Failed to fetch user wardrobe items')
    }

    // Check if user has at least one item from each required category
    const userCategoryIds = new Set(userItems?.map((item) => item.category_id) || [])

    const missingCategories = requiredCategories.filter((category) => !userCategoryIds.has(category.id))

    if (missingCategories.length > 0) {
      const missingNames = missingCategories.map((cat) => cat.display_name).join(', ')
      throw new BadRequestException(`Missing required wardrobe items: ${missingNames}`)
    }
  }

  /**
   * Retrieves all wardrobe items for a user.
   *
   * @param userId - The user's ID
   * @returns Array of WardrobeItemDTO objects
   */
  private async getUserWardrobeItems(userId: string): Promise<WardrobeItemDTO[]> {
    const { data: items, error } = await this.supabase.from('wardrobe_items').select('*').eq('user_id', userId)

    if (error) {
      throw new InternalServerErrorException('Failed to fetch wardrobe items')
    }

    return items || []
  }

  /**
   * Mock AI generation for development purposes.
   * In production, this would call an actual AI service (e.g., via Openrouter.ai).
   *
   * @param styleId - The style ID for the creations
   * @param userId - The user's ID
   * @param wardrobeItems - The user's wardrobe items
   * @returns Array of generated CreationDTO objects
   */
  private async mockAIGeneration(
    styleId: string,
    userId: string,
    wardrobeItems: WardrobeItemDTO[],
  ): Promise<CreationDTO[]> {
    // Mock data: Generate 3 sample creations
    const mockCreations: CreationDTO[] = []

    for (let i = 0; i < 3; i++) {
      const creationName = `AI Generated Creation ${i + 1}`
      const imagePath = `/mock/creation-${Date.now()}-${i}.png`

      // Insert the creation into the database
      const { data: creation, error } = await this.supabase
        .from('creations')
        .insert({
          name: creationName,
          image_path: imagePath,
          style_id: styleId,
          user_id: userId,
          status: 'pending',
        })
        .select()
        .single()

      if (error || !creation) {
        throw new InternalServerErrorException('Failed to create mock generation')
      }

      // Link random wardrobe items to this creation (for demonstration)
      const randomItems = this.selectRandomItems(wardrobeItems, 3)
      for (const item of randomItems) {
        await this.supabase.from('creation_items').insert({
          creation_id: creation.id,
          item_id: item.id,
        })
      }

      mockCreations.push(creation)
    }

    return mockCreations
  }

  /**
   * Selects a random subset of items from an array.
   *
   * @param items - The array of items
   * @param count - Number of items to select
   * @returns Array of randomly selected items
   */
  private selectRandomItems<T>(items: T[], count: number): T[] {
    const shuffled = [...items].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(count, items.length))
  }
}
