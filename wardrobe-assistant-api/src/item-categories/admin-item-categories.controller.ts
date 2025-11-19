import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Param,
  UseGuards,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common'
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AdminGuard } from '../auth/admin.guard'
import { ItemCategoriesService } from './item-categories.service'
import { CreateItemCategoryDto, UpdateItemCategoryDto } from './dto/admin-item-category.dto'
import type { ItemCategoryDTO } from 'shared/src/types/dto'

@ApiTags('admin/item_categories')
@ApiHeader({ name: 'x-admin-secret', required: true, description: 'Admin secret (SUPABASE_SERVICE_ROLE_KEY)' })
@UseGuards(AdminGuard)
@Controller('admin/item_categories')
export class AdminItemCategoriesController {
  constructor(private readonly itemCategoriesService: ItemCategoriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new item category (admin)' })
  @ApiResponse({
    status: 201,
    description: 'Category created',
    schema: {
      example: {
        id: '2b9b8b3a-1234-4b6e-9a1a-0c1d2e3f4a5b',
        name: 'headwear',
        display_name: 'Okrycie głowy',
        is_required: false,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - validation failed',
    schema: { example: { statusCode: 400, message: ['name must be a string'], error: 'Bad Request' } },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing x-admin-secret',
    schema: { example: { statusCode: 401, message: 'Missing x-admin-secret header', error: 'Unauthorized' } },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - invalid x-admin-secret',
    schema: { example: { statusCode: 403, message: 'Invalid admin secret', error: 'Forbidden' } },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - name already exists',
    schema: {
      example: { statusCode: 409, message: "Category with name 'headwear' already exists", error: 'Conflict' },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
    schema: { example: { statusCode: 500, message: 'Server error', error: 'Internal Server Error' } },
  })
  async create(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
    body: CreateItemCategoryDto,
  ): Promise<ItemCategoryDTO> {
    return this.itemCategoriesService.createCategory(body)
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an item category by id (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Category updated',
    schema: {
      example: {
        id: '2b9b8b3a-1234-4b6e-9a1a-0c1d2e3f4a5b',
        name: 'top',
        display_name: 'Okrycie górne',
        is_required: true,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - validation failed',
    schema: { example: { statusCode: 400, message: ['display_name cannot be empty'], error: 'Bad Request' } },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing x-admin-secret',
    schema: { example: { statusCode: 401, message: 'Missing x-admin-secret header', error: 'Unauthorized' } },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - invalid x-admin-secret',
    schema: { example: { statusCode: 403, message: 'Invalid admin secret', error: 'Forbidden' } },
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - category does not exist',
    schema: {
      example: { statusCode: 404, message: 'Item category with id 2b9b8b3a-... not found', error: 'Not Found' },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - name already exists',
    schema: { example: { statusCode: 409, message: 'Category name already exists', error: 'Conflict' } },
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
    schema: { example: { statusCode: 500, message: 'Server error', error: 'Internal Server Error' } },
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
    body: UpdateItemCategoryDto,
  ): Promise<ItemCategoryDTO> {
    return this.itemCategoriesService.updateCategory(id, body)
  }
}
