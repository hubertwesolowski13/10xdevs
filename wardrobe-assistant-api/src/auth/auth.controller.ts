import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { RegisterUserDto } from './dto/register-user.dto'
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'

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
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or username already taken' })
  @ApiResponse({ status: 500, description: 'Server error' })
  async signup(@Body() body: RegisterUserDto) {
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
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 500, description: 'Server error' })
  async login(@Body() body: LoginUserDto) {
    const result = await this.authService.login(body)
    return result
  }
}
