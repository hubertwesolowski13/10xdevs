import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator'

const SORTABLE_FIELDS = ['created_at', 'updated_at', 'name', 'status'] as const
type SortableField = (typeof SORTABLE_FIELDS)[number]

const STATUS_VALUES = ['pending', 'accepted', 'rejected'] as const
type StatusValue = (typeof STATUS_VALUES)[number]

export class ListCreationsQuery {
  @ApiPropertyOptional({ description: 'Numer strony (start od 1)', default: 1, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : 1))
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({ description: 'Liczba elementów na stronę', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : 20))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20

  @ApiPropertyOptional({ description: 'Filtr po statusie kreacji', enum: STATUS_VALUES })
  @IsOptional()
  @IsIn(STATUS_VALUES as unknown as string[])
  status?: StatusValue

  @ApiPropertyOptional({ description: 'Filtr po stylu (UUID v4)' })
  @IsOptional()
  @IsUUID('4')
  style_id?: string

  @ApiPropertyOptional({ description: 'Szukaj po nazwie (case-insensitive, partial match)' })
  @IsOptional()
  search?: string

  @ApiPropertyOptional({ description: 'Pole sortowania', enum: SORTABLE_FIELDS, default: 'created_at' })
  @IsOptional()
  @IsIn(SORTABLE_FIELDS as unknown as string[])
  sort_by?: SortableField = 'created_at'

  @ApiPropertyOptional({ description: 'Kierunek sortowania', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc'
}

export { SORTABLE_FIELDS, STATUS_VALUES }
