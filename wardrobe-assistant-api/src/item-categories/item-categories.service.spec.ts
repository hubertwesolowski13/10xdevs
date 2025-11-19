import { InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { ItemCategoriesService } from './item-categories.service'

// Minimal chainable mock for Supabase client
function createSupabaseMock() {
  const state: { listResult?: { data: any; error: any } } = {}

  const chain = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockImplementation(() => Promise.resolve(state.listResult ?? { data: null, error: null })),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockImplementation(() => Promise.resolve(state.listResult ?? { data: null, error: null })),
    maybeSingle: jest.fn().mockImplementation(() => Promise.resolve(state.listResult ?? { data: null, error: null })),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
  }

  const client = {
    from: jest.fn().mockReturnValue(chain),
  } as any

  const setListResult = (data: any, error: any = null) => {
    state.listResult = { data, error }
  }

  return { client, setListResult, chain }
}

describe('ItemCategoriesService', () => {
  let service: ItemCategoriesService
  const supabaseMock = createSupabaseMock()

  beforeEach(() => {
    jest.clearAllMocks()
    const supabaseService = { client: supabaseMock.client } as any
    service = new ItemCategoriesService(supabaseService)
  })

  describe('listAll', () => {
    it('returns sorted list on success', async () => {
      const rows = [
        { id: '1', name: 'top', display_name: 'Top', is_required: true },
        { id: '2', name: 'headwear', display_name: 'Headwear', is_required: false },
      ]
      supabaseMock.setListResult(rows)

      const result = await service.listAll()
      expect(result).toEqual(rows)
      expect(supabaseMock.client.from).toHaveBeenCalledWith('item_categories')
    })

    it('throws NotFoundException when empty', async () => {
      supabaseMock.setListResult([])
      await expect(service.listAll()).rejects.toBeInstanceOf(NotFoundException)
    })

    it('throws InternalServerErrorException on db error', async () => {
      supabaseMock.setListResult(null, { message: 'db down' })
      await expect(service.listAll()).rejects.toBeInstanceOf(InternalServerErrorException)
    })
  })
})
