import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'

export class CreateWardrobeItemDto {
  @ApiProperty({ description: 'Category ID (UUID v4) of the wardrobe item' })
  @IsUUID('4')
  category_id!: string

  @ApiProperty({ description: 'Name of the wardrobe item', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string

  @ApiProperty({ description: 'Color of the wardrobe item', maxLength: 60 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  color!: string

  @ApiPropertyOptional({ description: 'Brand of the wardrobe item', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string | null
}
