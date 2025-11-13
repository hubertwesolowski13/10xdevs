import { IsUUID, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO for generating creations via AI.
 * Validates that the style_id is a valid UUID.
 */
export class GenerateCreationsDto {
  @ApiProperty({
    description: 'The UUID of the style for which to generate creations',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'style_id must be a valid UUID' })
  @IsNotEmpty({ message: 'style_id is required' })
  style_id: string
}
