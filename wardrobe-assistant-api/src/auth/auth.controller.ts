import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { RegisterUserDto } from './dto/register-user.dto'
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'
import type { ProfileDTO } from 'shared/src/types/dto'

class LoginUserDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string

  @IsString()
  @MinLength(6)
  password!: string
}

@ApiTags('auth')
@Controller('auth/v1')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user. Also ensures a profile row is created.
   * Returns newly created profile data on success.
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterUserDto })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    schema: {
      example: {
        id: '9d7c5f3a-1234-4567-8901-abcdefabcdef',
        username: 'user123',
        created_at: '2025-01-01T12:00:00.000Z',
        updated_at: '2025-01-01T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error or username already taken' })
  @ApiResponse({ status: 500, description: 'Server error' })
  async signup(@Body() body: RegisterUserDto): Promise<ProfileDTO> {
    const result = await this.authService.signup(body)
    return result
  }

  /**
   * Login an existing user using email and password.
   * Returns an access token and profile data on success.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user with email and password' })
  @ApiBody({
    type: LoginUserDto,
    examples: {
      default: {
        value: { email: 'user@example.com', password: 'StrongPass123' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Login successful',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        profile: {
          id: '9d7c5f3a-1234-4567-8901-abcdefabcdef',
          username: 'user123',
          created_at: '2025-01-01T12:00:00.000Z',
          updated_at: '2025-01-01T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 500, description: 'Server error' })
  async login(@Body() body: LoginUserDto): Promise<{ access_token: string; profile: ProfileDTO }> {
    const result = await this.authService.login(body)
    return result
  }
}
