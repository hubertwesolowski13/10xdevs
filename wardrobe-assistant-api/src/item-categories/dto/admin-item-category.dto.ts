import { ApiProperty, PartialType } from '@nestjs/swagger'
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator'

/**
 * DTOs for admin create/update of Item Categories
 */
export class CreateItemCategoryDto {
  @ApiProperty({ example: 'headwear', description: 'Stable, URL-safe system name (unique, lowercase, kebab-case)' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'name must be lowercase kebab-case: letters, numbers, hyphens only',
  })
  name!: string

  @ApiProperty({ example: 'Okrycie głowy', description: 'Human-readable display name' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 60)
  display_name!: string

  @ApiProperty({
    example: true,
    description: 'Whether the category is required in creation generation',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_required?: boolean
}

export class UpdateItemCategoryDto extends PartialType(CreateItemCategoryDto) {
  // All fields optional for update; validation from Create is inherited
}
