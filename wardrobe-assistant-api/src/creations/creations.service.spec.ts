import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { CreationsService } from './creations.service'

function createSupabaseMock() {
  const chain: any = {
    // common query-builder methods chained by supabase-js
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
  }
  const client: any = {
    from: jest.fn().mockReturnValue(chain),
  }
  return { client, chain }
}

describe('CreationsService.createCreation', () => {
  const userId = 'user-uuid-1234'
  const styleId = '123e4567-e89b-12d3-a456-426614174000'
  const payload = { style_id: styleId, name: 'Casual Friday', image_path: '/images/creations/cf.png' }

  let service: CreationsService
  const supabaseMock = createSupabaseMock()

  beforeEach(() => {
    jest.clearAllMocks()
    const supabaseService = { client: supabaseMock.client } as any
    service = new CreationsService(supabaseService)
  })

  it('creates a creation successfully', async () => {
    // 0) duplicate check returns null (no duplicate)
    ;(supabaseMock.chain.maybeSingle as jest.Mock).mockResolvedValueOnce({ data: null, error: null })
    // 1) style exists
    ;(supabaseMock.chain.single as jest.Mock).mockResolvedValueOnce({ data: { id: styleId }, error: null })
    // 2) insert returns inserted row on final .single()
    const inserted = {
      id: 'a1b2c3d4-e5f6-4789-abcd-0123456789ab',
      name: payload.name,
      image_path: payload.image_path,
      style_id: styleId,
      status: 'pending',
      created_at: '2025-11-19T22:15:00.000Z',
      updated_at: '2025-11-19T22:15:00.000Z',
      user_id: userId,
    }
    ;(supabaseMock.chain.single as jest.Mock).mockResolvedValueOnce({ data: inserted, error: null })

    const result = await service.createCreation(payload, userId)
    expect(result).toEqual(inserted)
    expect(supabaseMock.client.from).toHaveBeenCalledWith('creations') // duplicate check
    expect(supabaseMock.client.from).toHaveBeenCalledWith('styles') // style existence
    expect(supabaseMock.chain.insert).toHaveBeenCalled() // insert path
  })

  it('throws 404 when style does not exist', async () => {
    ;(supabaseMock.chain.maybeSingle as jest.Mock).mockResolvedValueOnce({ data: null, error: null })
    // style query returns error
    ;(supabaseMock.chain.single as jest.Mock).mockResolvedValueOnce({ data: null, error: { message: 'not found' } })

    await expect(service.createCreation(payload, userId)).rejects.toBeInstanceOf(NotFoundException)
  })

  it('throws 409 when duplicate name found in pre-check', async () => {
    ;(supabaseMock.chain.maybeSingle as jest.Mock).mockResolvedValueOnce({ data: { id: 'dup' }, error: null })
    await expect(service.createCreation(payload, userId)).rejects.toBeInstanceOf(ConflictException)
  })

  it('throws 409 when DB insert fails with unique_violation 23505', async () => {
    // no duplicate in pre-check
    ;(supabaseMock.chain.maybeSingle as jest.Mock).mockResolvedValueOnce({ data: null, error: null })
    // style exists
    ;(supabaseMock.chain.single as jest.Mock).mockResolvedValueOnce({ data: { id: styleId }, error: null })
    // insert path final single returns error code 23505
    ;(supabaseMock.chain.single as jest.Mock).mockResolvedValueOnce({ data: null, error: { code: '23505' } })

    await expect(service.createCreation(payload, userId)).rejects.toBeInstanceOf(ConflictException)
  })

  it('throws 500 when duplicate check query errors', async () => {
    ;(supabaseMock.chain.maybeSingle as jest.Mock).mockResolvedValueOnce({ data: null, error: { message: 'db' } })
    await expect(service.createCreation(payload, userId)).rejects.toBeInstanceOf(InternalServerErrorException)
  })

  it('throws 500 when insert returns unexpected error', async () => {
    ;(supabaseMock.chain.maybeSingle as jest.Mock).mockResolvedValueOnce({ data: null, error: null })
    ;(supabaseMock.chain.single as jest.Mock).mockResolvedValueOnce({ data: { id: styleId }, error: null })
    ;(supabaseMock.chain.single as jest.Mock).mockResolvedValueOnce({ data: null, error: { code: 'XX000' } })
    await expect(service.createCreation(payload, userId)).rejects.toBeInstanceOf(InternalServerErrorException)
  })
})
