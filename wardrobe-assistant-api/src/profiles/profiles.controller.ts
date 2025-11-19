import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Request,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { ProfilesService } from './profiles.service'
import { UpdateProfileDto } from './dto/update-profile.dto'
import type { AuthenticatedRequest } from 'shared/src/types/dto'
import { JwtOrAdminGuard } from '../auth/jwt-or-admin.guard'

@ApiTags('profiles')
@ApiBearerAuth()
@UseGuards(JwtOrAdminGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  /**
   * GET /profiles/:user_id — returns the public profile data.
   * Access: owner or admin (via x-admin-secret header)
   */
  @Get(':user_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get public profile by user id' })
  @ApiResponse({ status: 200, description: 'Profile found and returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing/invalid auth' })
  @ApiResponse({ status: 403, description: 'Forbidden - accessing profile of another user without admin' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getProfile(
    @Param('user_id', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    // requesterId comes from JWT guard when non-admin; admin path leaves it undefined
    const requesterId = req.user?.id || null

    return this.profilesService.getProfileById(userId, requesterId, req.headers)
  }

  /**
   * PATCH /profiles/:user_id — updates allowed fields of the profile.
   * Access: owner or admin (via x-admin-secret header)
   */
  @Patch(':user_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update profile fields (e.g., username)' })
  @ApiResponse({ status: 200, description: 'Profile successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad Request - invalid payload or username taken' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing/invalid auth' })
  @ApiResponse({ status: 403, description: 'Forbidden - updating profile of another user without admin' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async updateProfile(
    @Param('user_id', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() body: UpdateProfileDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const requesterId = req.user?.id || null

    return this.profilesService.updateProfile(userId, body, requesterId, req.headers)
  }
}
