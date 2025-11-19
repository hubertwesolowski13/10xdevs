import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator'

const SORTABLE_FIELDS = ['created_at', 'updated_at', 'name', 'color', 'brand'] as const
type SortableField = (typeof SORTABLE_FIELDS)[number]

export class ListWardrobeItemsQuery {
  @ApiPropertyOptional({ description: 'Page number (starting from 1)', default: 1, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : 1))
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : 20))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20

  @ApiPropertyOptional({ description: 'Filter by category UUID' })
  @IsOptional()
  @IsUUID('4')
  category_id?: string

  @ApiPropertyOptional({ description: 'Filter by color (case-insensitive, partial match)' })
  @IsOptional()
  color?: string

  @ApiPropertyOptional({ description: 'Filter by brand (case-insensitive, partial match)' })
  @IsOptional()
  brand?: string

  @ApiPropertyOptional({ description: 'Field to sort by', enum: SORTABLE_FIELDS, default: 'created_at' })
  @IsOptional()
  @IsIn(SORTABLE_FIELDS as unknown as string[])
  sort_by?: SortableField = 'created_at'

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc'
}

export { SORTABLE_FIELDS }
