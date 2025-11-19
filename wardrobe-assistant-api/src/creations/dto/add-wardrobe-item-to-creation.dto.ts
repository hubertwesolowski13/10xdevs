import { IsNotEmpty, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * DTO for adding a wardrobe item to a creation.
 */
export class AddWardrobeItemToCreationDto {
  @ApiProperty({ description: 'UUID v4 of the wardrobe item to add to the creation' })
  @IsUUID('4', { message: 'item_id must be a valid UUID' })
  @IsNotEmpty({ message: 'item_id is required' })
  item_id: string
}
