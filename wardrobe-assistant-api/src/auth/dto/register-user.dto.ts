import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class AdditionalMetadataDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string
}

export class RegisterUserDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string

  @IsString()
  @MinLength(6)
  password!: string

  @IsOptional()
  @ValidateNested()
  @Type(() => AdditionalMetadataDto)
  additional_metadata?: AdditionalMetadataDto
}
