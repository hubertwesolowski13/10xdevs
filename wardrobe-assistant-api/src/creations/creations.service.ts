import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from 'shared/src/types/database'
import type { CreationDTO, WardrobeItemDTO } from 'shared/src/types/dto'
import { SupabaseService } from '../supabase/supabase.service'

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
   * @param creationId - The UUID of the creation to accept
   * @param userId - The authenticated user's ID
   * @throws NotFoundException if the creation doesn't exist
   * @throws BadRequestException if the creation doesn't belong to the user
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
