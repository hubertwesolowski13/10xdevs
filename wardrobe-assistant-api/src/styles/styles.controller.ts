import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { StylesService } from './styles.service'
import type { StyleDTO } from 'shared/src/types/dto'

@ApiTags('styles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('styles')
export class StylesController {
  constructor(private readonly stylesService: StylesService) {}

  /**
   * GET /styles — returns the list of available styles.
   * Access: any authenticated user
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all styles' })
  @ApiResponse({
    status: 200,
    description: 'List of styles returned successfully',
    schema: {
      example: [
        { id: '11111111-2222-3333-4444-555555555555', name: 'casual', display_name: 'Casual' },
        { id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', name: 'elegant', display_name: 'Elegancki' },
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
    description: 'No styles found',
    schema: { example: { statusCode: 404, message: 'No styles found', error: 'Not Found' } },
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
    schema: { example: { statusCode: 500, message: 'Server error', error: 'Internal Server Error' } },
  })
  async listStyles(): Promise<StyleDTO[]> {
    return this.stylesService.listAll()
  }
}
