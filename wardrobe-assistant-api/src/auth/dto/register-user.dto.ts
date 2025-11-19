import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class AdditionalMetadataDto {
  @ApiPropertyOptional({ minLength: 3, example: 'jan_kowalski' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string
}

export class RegisterUserDto {
  @ApiProperty({ format: 'email', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string

  @ApiProperty({ minLength: 6, example: 'StrongPass123' })
  @IsString()
  @MinLength(6)
  password!: string

  @ApiPropertyOptional({ type: () => AdditionalMetadataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdditionalMetadataDto)
  additional_metadata?: AdditionalMetadataDto
}
