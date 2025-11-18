import { Controller, Post, Body, Param, HttpCode, HttpStatus, Request, ParseUUIDPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { GenerateCreationsDto } from './dto/generate-creations.dto'
import { CreationsService } from './creations.service'
import { MOCK_USER_ID } from '../../mocks/user'
import type { User } from '@supabase/supabase-js'
import type { Request as ExpressRequest } from 'express'

interface AuthenticatedRequest extends ExpressRequest {
  // Supabase User object placed by auth middleware/guard
  user?: User | null
}

/**
 * Controller for handling creation-related endpoints.
 * All endpoints require authentication.
 */
@ApiTags('creations')
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
  async generateCreations(@Body() generateCreationsDto: GenerateCreationsDto, @Request() req: AuthenticatedRequest) {
    // Extract user ID from the authenticated request
    // In a real implementation, this would come from a JWT guard
    const userId: string = req.user?.id || MOCK_USER_ID

    return this.creationsService.generateCreations(generateCreationsDto.style_id, userId)
  }

  /**
   * Endpoint to accept a generated creation.
   * Updates the creation status to 'accepted'.
   *
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
  async acceptCreation(
    @Param('creationId', new ParseUUIDPipe({ version: '4' })) creationId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    // Extract user ID from the authenticated request
    const userId = req.user?.id || MOCK_USER_ID

    await this.creationsService.acceptCreation(creationId, userId)
    return { message: 'Creation accepted successfully' }
  }

  /**
   * Endpoint to reject a generated creation.
   * Updates the creation status to 'rejected'.
   *
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
  async rejectCreation(
    @Param('creationId', new ParseUUIDPipe({ version: '4' })) creationId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    // Extract user ID from the authenticated request
    const userId = req.user?.id || MOCK_USER_ID

    await this.creationsService.rejectCreation(creationId, userId)
    return { message: 'Creation rejected successfully' }
  }
}
