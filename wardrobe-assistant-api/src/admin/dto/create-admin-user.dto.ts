import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class CreateAdminUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string

  @ApiProperty({ example: 'StrongPassw0rd!', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string
}
