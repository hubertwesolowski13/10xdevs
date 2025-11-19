import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { AuthenticatedRequest, WardrobeItemDTO } from 'shared/src/types/dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { WardrobeItemsService } from './wardrobe-items.service'
import { ListWardrobeItemsQuery } from './dto/list-wardrobe-items.query'
import { CreateWardrobeItemDto } from './dto/create-wardrobe-item.dto'
import { UpdateWardrobeItemDto } from './dto/update-wardrobe-item.dto'

@ApiTags('wardrobe_items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wardrobe_items')
export class WardrobeItemsController {
  constructor(private readonly wardrobeItemsService: WardrobeItemsService) {}

  /**
   * GET /wardrobe_items — lists authenticated user's wardrobe items with pagination/filters.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List wardrobe items of the authenticated user' })
  @ApiResponse({ status: 200, description: 'List returned', schema: { example: [] } })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(@Query() query: ListWardrobeItemsQuery, @Request() req: AuthenticatedRequest): Promise<WardrobeItemDTO[]> {
    const userId = req.user!.id
    return this.wardrobeItemsService.list(userId, query)
  }

  /**
   * POST /wardrobe_items — creates a new wardrobe item for the authenticated user
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new wardrobe item' })
  @ApiResponse({ status: 201, description: 'Item created' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Server error' })
  async create(@Body() dto: CreateWardrobeItemDto, @Request() req: AuthenticatedRequest): Promise<WardrobeItemDTO> {
    const userId = req.user!.id
    return this.wardrobeItemsService.create(userId, dto)
  }

  /**
   * PATCH /wardrobe_items/:id — partially updates an existing wardrobe item
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing wardrobe item' })
  @ApiResponse({ status: 200, description: 'Item updated' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateWardrobeItemDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<WardrobeItemDTO> {
    const userId = req.user!.id
    return this.wardrobeItemsService.update(userId, id, dto)
  }

  /**
   * DELETE /wardrobe_items/:id — removes a wardrobe item
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a wardrobe item' })
  @ApiResponse({ status: 204, description: 'Item deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<void> {
    const userId = req.user!.id
    await this.wardrobeItemsService.remove(userId, id)
  }
}
