import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'

/**
 * Partial update DTO for Wardrobe Item
 * All fields are optional; validators ensure correct formats when provided.
 */
export class UpdateWardrobeItemDto {
  @ApiPropertyOptional({ description: 'Category ID (UUID v4) of the wardrobe item' })
  @IsOptional()
  @IsUUID('4')
  category_id?: string

  @ApiPropertyOptional({ description: 'Name of the wardrobe item', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string

  @ApiPropertyOptional({ description: 'Color of the wardrobe item', maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  color?: string

  @ApiPropertyOptional({ description: 'Brand of the wardrobe item', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string | null
}
