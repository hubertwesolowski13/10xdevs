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
import { StylesService } from './styles.service'
import { CreateStyleDto, UpdateStyleDto } from './dto/admin-style.dto'
import type { StyleDTO } from 'shared/src/types/dto'

@ApiTags('admin/styles')
@ApiHeader({ name: 'x-admin-secret', required: true, description: 'Admin secret (SUPABASE_SERVICE_ROLE_KEY)' })
@UseGuards(AdminGuard)
@Controller('admin/styles')
export class AdminStylesController {
  constructor(private readonly stylesService: StylesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new style (admin)' })
  @ApiResponse({
    status: 201,
    description: 'Style created',
    schema: { example: { id: '11111111-2222-3333-4444-555555555555', name: 'casual', display_name: 'Casual' } },
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
    schema: { example: { statusCode: 409, message: "Style with name 'casual' already exists", error: 'Conflict' } },
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
    schema: { example: { statusCode: 500, message: 'Server error', error: 'Internal Server Error' } },
  })
  async create(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
    body: CreateStyleDto,
  ): Promise<StyleDTO> {
    return this.stylesService.createStyle(body)
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a style by id (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Style updated',
    schema: { example: { id: '11111111-2222-3333-4444-555555555555', name: 'elegant', display_name: 'Elegancki' } },
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
    description: 'Not found - style does not exist',
    schema: { example: { statusCode: 404, message: 'Style with id 1111-... not found', error: 'Not Found' } },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - name already exists',
    schema: { example: { statusCode: 409, message: 'Style name already exists', error: 'Conflict' } },
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
    schema: { example: { statusCode: 500, message: 'Server error', error: 'Internal Server Error' } },
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
    body: UpdateStyleDto,
  ): Promise<StyleDTO> {
    return this.stylesService.updateStyle(id, body)
  }
}
