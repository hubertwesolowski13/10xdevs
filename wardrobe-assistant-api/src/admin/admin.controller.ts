import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, ValidationPipe } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AdminGuard } from '../auth/admin.guard'
import { AdminService } from './admin.service'
import { CreateAdminUserDto } from './dto/create-admin-user.dto'

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('users')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  @ApiResponse({
    status: 201,
    description: 'User created',
    schema: { example: { id: 'uuid', email: 'user@example.com' } },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - validation failed or user exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing admin secret' })
  @ApiResponse({ status: 403, description: 'Forbidden - invalid admin secret' })
  async createUser(@Body(new ValidationPipe({ whitelist: true })) body: CreateAdminUserDto) {
    const { email, password } = body
    const result = await this.adminService.createUser(email, password)
    return result
  }
}
