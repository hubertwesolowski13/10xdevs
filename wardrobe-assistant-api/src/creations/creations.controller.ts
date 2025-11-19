import { Controller, Post, Body, Param, HttpCode, HttpStatus, Request, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { GenerateCreationsDto } from './dto/generate-creations.dto'
import { CreationsService } from './creations.service'
import type { AuthenticatedRequest } from 'shared/src/types/dto.ts'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

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
