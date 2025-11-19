import { IsNotEmpty, IsString, IsUUID, Matches } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO for manually creating a new creation.
 * Validates required fields and basic formats.
 */
export class CreateCreationDto {
  @ApiProperty({ description: 'UUID v4 of the style for the creation' })
  @IsUUID('4', { message: 'style_id must be a valid UUID' })
  @IsNotEmpty({ message: 'style_id is required' })
  style_id: string

  @ApiProperty({ description: 'Human-friendly name of the creation', example: 'Casual Friday' })
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  name: string

  @ApiProperty({
    description: 'Path to the image for the creation. Allowed extensions: .png, .jpg, .jpeg, .webp',
    example: '/images/creations/abc.png',
  })
  @IsString({ message: 'image_path must be a string' })
  @IsNotEmpty({ message: 'image_path is required' })
  // Optional lightweight check for common image extensions; storage path is treated as opaque
  @Matches(/\.(png|jpg|jpeg|webp)$/i, {
    message: 'image_path should point to a .png, .jpg, .jpeg or .webp file',
  })
  image_path: string
}
