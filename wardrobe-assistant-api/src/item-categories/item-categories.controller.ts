import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ItemCategoriesService } from './item-categories.service'
import type { ItemCategoryDTO } from 'shared/src/types/dto'

@ApiTags('item_categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('item_categories')
export class ItemCategoriesController {
  constructor(private readonly itemCategoriesService: ItemCategoriesService) {}

  /**
   * GET /item_categories — returns the list of available item categories.
   * Access: any authenticated user
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all item categories' })
  @ApiResponse({
    status: 200,
    description: 'List of item categories returned successfully',
    schema: {
      example: [
        {
          id: '2b9b8b3a-1234-4b6e-9a1a-0c1d2e3f4a5b',
          name: 'headwear',
          display_name: 'Okrycie głowy',
          is_required: false,
        },
        { id: '5c6d7e8f-2345-4a6b-8c9d-0e1f2a3b4c5d', name: 'top', display_name: 'Okrycie górne', is_required: true },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing/invalid auth',
    schema: { example: { statusCode: 401, message: 'Missing Authorization header', error: 'Unauthorized' } },
  })
  @ApiResponse({
    status: 404,
    description: 'No item categories found',
    schema: { example: { statusCode: 404, message: 'No item categories found', error: 'Not Found' } },
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
    schema: { example: { statusCode: 500, message: 'Server error', error: 'Internal Server Error' } },
  })
  async listItemCategories(): Promise<ItemCategoryDTO[]> {
    return this.itemCategoriesService.listAll()
  }
}
