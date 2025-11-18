import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, Length, Matches } from 'class-validator'

/**
 * DTO for updating the user profile. Matches UpdateProfileCommand from shared types.
 * Currently only supports username updates. Extend as needed when schema evolves.
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Public username, must be unique', minLength: 3, maxLength: 30 })
  @IsOptional()
  @IsString()
  @Length(3, 30)
  // Allow letters, numbers and underscore
  @Matches(/^[A-Za-z0-9_]+$/, {
    message: 'username can only contain letters, numbers and underscores',
  })
  username?: string
}
