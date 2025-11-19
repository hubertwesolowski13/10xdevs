import { InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { StylesService } from './styles.service'

function createSupabaseMock() {
  const chain: any = {
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

describe('StylesService', () => {
  let service: StylesService
  const supabaseMock = createSupabaseMock()

  beforeEach(() => {
    jest.clearAllMocks()
    const supabaseService = { client: supabaseMock.client } as any
    service = new StylesService(supabaseService)
  })

  describe('listAll', () => {
    it('returns list on success', async () => {
      ;(supabaseMock.chain.order as jest.Mock).mockResolvedValueOnce({
        data: [
          { id: '1', name: 'casual', display_name: 'Casual' },
          { id: '2', name: 'elegant', display_name: 'Elegancki' },
        ],
        error: null,
      })

      const result = await service.listAll()
      expect(result.length).toBe(2)
      expect(supabaseMock.client.from).toHaveBeenCalledWith('styles')
    })

    it('throws NotFoundException when empty', async () => {
      ;(supabaseMock.chain.order as jest.Mock).mockResolvedValueOnce({ data: [], error: null })
      await expect(service.listAll()).rejects.toBeInstanceOf(NotFoundException)
    })

    it('throws InternalServerErrorException on db error', async () => {
      ;(supabaseMock.chain.order as jest.Mock).mockResolvedValueOnce({ data: null, error: { message: 'x' } })
      await expect(service.listAll()).rejects.toBeInstanceOf(InternalServerErrorException)
    })
  })
})
