import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Request,
  ParseUUIDPipe,
  UseGuards,
  Get,
  Query,
  Res,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger'
import { GenerateCreationsDto } from './dto/generate-creations.dto'
import { CreationsService } from './creations.service'
import type { AuthenticatedRequest } from 'shared/src/types/dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CreateCreationDto } from './dto/create-creation.dto'
import { ListCreationsQuery } from './dto/list-creations.query'
import { AddWardrobeItemToCreationDto } from './dto/add-wardrobe-item-to-creation.dto'
import { ListCreationItemsQuery } from './dto/list-creation-items.query'
import { ApiErrorResponseDto } from '../common/dto/api-error-response.dto'
import type { Response } from 'express'

/**
 * Controller for handling creation-related endpoints.
 * All endpoints require authentication.
 */
@ApiTags('creations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('creations')
export class CreationsController {
  constructor(private readonly creationsService: CreationsService) {}

  /**
   * GET /creations — listuje kreacje zalogowanego użytkownika z paginacją i filtrami.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List creations of the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List returned',
    schema: {
      example: [
        {
          id: 'a1b2c3d4-e5f6-4789-abcd-0123456789ab',
          name: 'Casual Friday',
          image_path: '/images/creations/casual_friday.png',
          style_id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'pending',
          created_at: '2025-11-19T22:15:00.000Z',
          updated_at: '2025-11-19T22:15:00.000Z',
          user_id: 'user-uuid-1234',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Server error' })
  async list(@Query() query: ListCreationsQuery, @Request() req: AuthenticatedRequest) {
    const userId = req.user!.id
    return this.creationsService.list(userId, query)
  }

  /**
   * POST /creations — manually creates a new creation for the authenticated user.
   *
   * Business flow:
   * - Validates payload (style_id UUID v4, non-empty name, non-empty image_path)
   * - Verifies style existence
   * - Persists creation with status 'pending'
   * - Returns created CreationDTO with 201 status
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new creation manually' })
  @ApiBody({
    description: 'Payload for creating a new creation',
    schema: {
      example: {
        style_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Casual Friday',
        image_path: '/images/creations/casual_friday.png',
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Creation created successfully',
    schema: {
      example: {
        id: 'a1b2c3d4-e5f6-4789-abcd-0123456789ab',
        name: 'Casual Friday',
        image_path: '/images/creations/casual_friday.png',
        style_id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'pending',
        created_at: '2025-11-19T22:15:00.000Z',
        updated_at: '2025-11-19T22:15:00.000Z',
        user_id: 'user-uuid-1234',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - user not authenticated' })
  @ApiResponse({ status: 404, description: 'Not found - style does not exist' })
  @ApiResponse({ status: 409, description: 'Conflict - creation name already exists for this user' })
  @ApiResponse({ status: 500, description: 'Internal Server Error - failed to create creation' })
  async createCreation(@Body() dto: CreateCreationDto, @Request() req: AuthenticatedRequest) {
    const userId = req.user!.id
    return this.creationsService.createCreation(
      {
        style_id: dto.style_id,
        name: dto.name,
        image_path: dto.image_path,
      },
      userId,
    )
  }

  /**
   * Endpoint to generate creations via AI based on a style.
   * Verifies that the user has required wardrobe items before generation.
   *
   * @param generateCreationsDto - Contains the style_id for generation
   * @param req - Express request object containing user information
   * @returns Array of generated creations
   */
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate creations via AI for a given style' })
  @ApiResponse({
    status: 200,
    description: 'Creations successfully generated',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - missing required wardrobe items or invalid style_id',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - user not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - style does not exist',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error - unexpected error during generation',
  })
  async generateCreations(@Body() generateCreationsDto: GenerateCreationsDto, @Request() req: AuthenticatedRequest) {
    // Extract user ID from the authenticated request (set by JwtAuthGuard)
    const userId: string = req.user!.id

    return this.creationsService.generateCreations(generateCreationsDto.style_id, userId)
  }

  /**
   * GET /creations/:creationId/items — listuje elementy garderoby powiązane z daną kreacją.
   */
  @Get(':creationId/items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List wardrobe items linked to a creation' })
  @ApiOkResponse({
    description: 'List of creation items returned',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              creation_id: { type: 'string', format: 'uuid' },
              item_id: { type: 'string', format: 'uuid' },
            },
          },
          example: [
            {
              id: '11111111-1111-1111-1111-111111111111',
              creation_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
              item_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            },
          ],
        },
        {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              creation_id: { type: 'string', format: 'uuid' },
              item_id: { type: 'string', format: 'uuid' },
              item: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  category_id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  color: { type: 'string' },
                  brand: { type: 'string', nullable: true },
                  created_at: { type: 'string', format: 'date-time' },
                  updated_at: { type: 'string', format: 'date-time' },
                  user_id: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
          example: [
            {
              id: '11111111-1111-1111-1111-111111111111',
              creation_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
              item_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
              item: {
                id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                category_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
                name: 'White T-Shirt',
                color: 'white',
                brand: 'Acme',
                created_at: '2025-11-19T22:15:00.000Z',
                updated_at: '2025-11-19T22:15:00.000Z',
                user_id: 'user-uuid-1234',
              },
            },
          ],
        },
      ],
    },
    headers: {
      'X-Total-Count': {
        description:
          'Total number of items matching the filter. Returned only when includeTotal=true query param is provided.',
        schema: { type: 'integer', example: 42 },
      },
      'Content-Range': {
        description:
          'Range of items returned in the current page in the format items <from>-<to>/<total>. Returned only when includeTotal=true.',
        schema: { type: 'string', example: 'items 0-19/42' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid creationId', type: ApiErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Not found - creation does not exist or not owned by user',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({ status: 500, description: 'Internal Server Error', type: ApiErrorResponseDto })
  async listCreationItems(
    @Param('creationId', new ParseUUIDPipe({ version: '4' })) creationId: string,
    @Query() query: ListCreationItemsQuery,
    @Request() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user!.id
    const result = await this.creationsService.listCreationItems(creationId, userId, query)

    // If includeTotal was requested, the service returns an object with items and total
    if (query.includeTotal && result && !Array.isArray(result)) {
      const total = result.total ?? 0
      const page = query.page ?? 1
      const limit = query.limit ?? 20
      const from = (page - 1) * limit
      const to = Math.min(from + limit - 1, Math.max(total - 1, 0))
      res.setHeader('X-Total-Count', String(total))
      res.setHeader('Content-Range', `items ${from}-${to}/${total}`)
      return result.items
    }

    return result
  }

  /**
   * POST /creations/:creationId/items — dodaje element garderoby do kreacji.
   */
  @Post(':creationId/items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a wardrobe item to a creation' })
  @ApiBody({ type: AddWardrobeItemToCreationDto })
  @ApiCreatedResponse({
    description: 'Item successfully added to creation',
    schema: {
      example: {
        id: 'd1e2f3a4-b5c6-4789-9012-34567890abcd',
        creation_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        item_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid IDs or payload', type: ApiErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: ApiErrorResponseDto })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - item cannot be added per business rules',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Not found - creation or item does not exist', type: ApiErrorResponseDto })
  @ApiResponse({
    status: 409,
    description: 'Conflict - item already added to this creation',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({ status: 500, description: 'Internal Server Error', type: ApiErrorResponseDto })
  async addWardrobeItemToCreation(
    @Param('creationId', new ParseUUIDPipe({ version: '4' })) creationId: string,
    @Body() dto: AddWardrobeItemToCreationDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user!.id
    return this.creationsService.addWardrobeItemToCreation(creationId, { item_id: dto.item_id }, userId)
  }

  /**
   * Endpoint to accept a generated creation.
   * Updates the creation status to 'accepted'.
   *
   * Notes:
   * - The request body is intentionally empty; the `creationId` is provided via the URL path.
   * - Kept symmetrical with the reject endpoint and the empty command model for forward compatibility.
   *
   * @see AcceptCreationCommand - empty payload maintained for consistency and future extensibility
   * @param creationId - The UUID of the creation to accept
   * @param req - Express request object containing user information
   * @returns Success message
   */
  @Post(':creationId/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a generated creation' })
  @ApiResponse({
    status: 200,
    description: 'Creation successfully accepted',
    schema: { example: { message: 'Creation accepted successfully' } },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - creation does not belong to user',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - user not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - creation does not exist',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error - unexpected error during acceptance',
  })
  async acceptCreation(
    @Param('creationId', new ParseUUIDPipe({ version: '4' })) creationId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user!.id

    await this.creationsService.acceptCreation(creationId, userId)
    return { message: 'Creation accepted successfully' }
  }

  /**
   * Endpoint to reject a generated creation.
   * Updates the creation status to 'rejected'.
   *
   * Notes:
   * - The request body is intentionally empty; the `creationId` is provided via the URL path.
   * - Mirrors the accept endpoint contract for consistency with the empty command model.
   *
   * @see AcceptCreationCommand - explains rationale for empty payload
   * @param creationId - The UUID of the creation to reject
   * @param req - Express request object containing user information
   * @returns Success message
   */
  @Post(':creationId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a generated creation' })
  @ApiResponse({
    status: 200,
    description: 'Creation successfully rejected',
    schema: { example: { message: 'Creation rejected successfully' } },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - creation does not belong to user or invalid creationId',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - user not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - creation does not exist',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error - unexpected error during rejection',
  })
  async rejectCreation(
    @Param('creationId', new ParseUUIDPipe({ version: '4' })) creationId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user!.id

    await this.creationsService.rejectCreation(creationId, userId)
    return { message: 'Creation rejected successfully' }
  }
}
