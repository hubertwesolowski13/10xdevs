import { BadRequestException, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { ItemCategoriesService } from './item-categories.service'

describe('ItemCategoriesService (admin methods)', () => {
  let service: ItemCategoriesService
  let supabase: any

  beforeEach(() => {
    const chain: any = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    }
    supabase = { from: jest.fn().mockReturnValue(chain), _chain: chain }
    const supabaseService = { client: supabase } as any
    service = new ItemCategoriesService(supabaseService)
  })

  describe('createCategory', () => {
    it('throws 400 when required fields missing', async () => {
      await expect(service.createCategory({ name: '', display_name: '' } as any)).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })

    it('throws 409 when name exists (pre-check)', async () => {
      supabase._chain.maybeSingle.mockResolvedValueOnce({ data: { id: 'x' }, error: null })
      await expect(
        service.createCategory({ name: 'headwear', display_name: 'Okrycie głowy', is_required: false }),
      ).rejects.toBeInstanceOf(ConflictException)
    })

    it('throws 500 when pre-check errors', async () => {
      supabase._chain.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'db' } })
      await expect(
        service.createCategory({ name: 'headwear', display_name: 'Okrycie głowy', is_required: false }),
      ).rejects.toBeInstanceOf(InternalServerErrorException)
    })

    it('throws 409 on unique violation from insert', async () => {
      supabase._chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
      supabase._chain.single.mockResolvedValueOnce({ data: null, error: { code: '23505' } })
      await expect(
        service.createCategory({ name: 'headwear', display_name: 'Okrycie głowy', is_required: false }),
      ).rejects.toBeInstanceOf(ConflictException)
    })

    it('returns row on success', async () => {
      supabase._chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
      const row = { id: '1', name: 'headwear', display_name: 'Okrycie głowy', is_required: false }
      supabase._chain.single.mockResolvedValueOnce({ data: row, error: null })
      const res = await service.createCategory({ name: 'headwear', display_name: 'Okrycie głowy' })
      expect(res).toEqual(row)
    })
  })

  describe('updateCategory', () => {
    it('throws 404 when not found', async () => {
      supabase._chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
      await expect(service.updateCategory('uuid', { display_name: 'x' })).rejects.toBeInstanceOf(NotFoundException)
    })

    it('throws 400 when name provided empty', async () => {
      supabase._chain.single.mockResolvedValueOnce({ data: { id: 'uuid', name: 'top' }, error: null })
      await expect(service.updateCategory('uuid', { name: '   ' })).rejects.toBeInstanceOf(BadRequestException)
    })

    it('throws 409 when new name taken', async () => {
      supabase._chain.single.mockResolvedValueOnce({ data: { id: 'uuid', name: 'top' }, error: null })
      supabase._chain.maybeSingle.mockResolvedValueOnce({ data: { id: 'another' }, error: null })
      await expect(service.updateCategory('uuid', { name: 'headwear' })).rejects.toBeInstanceOf(ConflictException)
    })

    it('throws 500 when uniqueness check fails', async () => {
      supabase._chain.single.mockResolvedValueOnce({ data: { id: 'uuid', name: 'top' }, error: null })
      supabase._chain.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'db' } })
      await expect(service.updateCategory('uuid', { name: 'headwear' })).rejects.toBeInstanceOf(
        InternalServerErrorException,
      )
    })
  })
})
