import { ApiProperty } from '@nestjs/swagger'

/**
 * Standardized error response DTO used across the API.
 * Matches NestJS default error shape.
 */
export class ApiErrorResponseDto {
  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode: number

  @ApiProperty({ example: 'Validation failed', description: 'Human-readable error message' })
  message: string | string[]

  @ApiProperty({ example: 'Bad Request', description: 'Short error name' })
  error: string
}
