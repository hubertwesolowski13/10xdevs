import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator'
import { Transform } from 'class-transformer'

/**
 * Query params for listing creation items with pagination and optional expansion.
 */
export class ListCreationItemsQuery {
  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20

  @ApiPropertyOptional({
    description: 'Optionally expand related entities',
    enum: ['item'],
    example: 'item',
  })
  @IsOptional()
  @IsIn(['item'])
  expand?: 'item'

  @ApiPropertyOptional({
    description:
      'Include total count of items matching the filter (returned in X-Total-Count and Content-Range headers)',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const v = value.toLowerCase()
      if (v === 'true' || v === '1') return true
      if (v === 'false' || v === '0') return false
    }
    return false
  })
  @IsBoolean()
  includeTotal?: boolean = false
}
