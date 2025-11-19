import { ApiProperty, PartialType } from '@nestjs/swagger'
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator'

/**
 * DTOs for admin create/update of Styles
 */
export class CreateStyleDto {
  @ApiProperty({ example: 'casual', description: 'Stable, URL-safe system name (unique, lowercase, kebab-case)' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'name must be lowercase kebab-case: letters, numbers, hyphens only',
  })
  name!: string

  @ApiProperty({ example: 'Casual', description: 'Human-readable display name' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 60)
  display_name!: string
}

export class UpdateStyleDto extends PartialType(CreateStyleDto) {
  // All fields optional for update; validation from Create is inherited
}
