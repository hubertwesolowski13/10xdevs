import { BadRequestException, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { StylesService } from './styles.service'

describe('StylesService (admin methods)', () => {
  let service: StylesService
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
    service = new StylesService(supabaseService)
  })

  describe('createStyle', () => {
    it('throws 400 when required fields missing', async () => {
      await expect(service.createStyle({ name: '', display_name: '' } as any)).rejects.toBeInstanceOf(
        BadRequestException,
      )
    })

    it('throws 409 when name exists (pre-check)', async () => {
      supabase._chain.maybeSingle.mockResolvedValueOnce({ data: { id: 'x' }, error: null })
      await expect(service.createStyle({ name: 'casual', display_name: 'Casual' })).rejects.toBeInstanceOf(
        ConflictException,
      )
    })

    it('throws 500 when pre-check errors', async () => {
      supabase._chain.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'db' } })
      await expect(service.createStyle({ name: 'casual', display_name: 'Casual' })).rejects.toBeInstanceOf(
        InternalServerErrorException,
      )
    })

    it('throws 409 on unique violation from insert', async () => {
      supabase._chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
      supabase._chain.single.mockResolvedValueOnce({ data: null, error: { code: '23505' } })
      await expect(service.createStyle({ name: 'casual', display_name: 'Casual' })).rejects.toBeInstanceOf(
        ConflictException,
      )
    })

    it('returns row on success', async () => {
      supabase._chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
      const row = { id: '1', name: 'casual', display_name: 'Casual' }
      supabase._chain.single.mockResolvedValueOnce({ data: row, error: null })
      const res = await service.createStyle({ name: 'casual', display_name: 'Casual' })
      expect(res).toEqual(row)
    })
  })

  describe('updateStyle', () => {
    it('throws 404 when not found', async () => {
      supabase._chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
      await expect(service.updateStyle('uuid', { display_name: 'x' })).rejects.toBeInstanceOf(NotFoundException)
    })

    it('throws 400 when name provided empty', async () => {
      supabase._chain.single.mockResolvedValueOnce({ data: { id: 'uuid', name: 'casual' }, error: null })
      await expect(service.updateStyle('uuid', { name: '   ' })).rejects.toBeInstanceOf(BadRequestException)
    })

    it('throws 409 when new name taken', async () => {
      supabase._chain.single.mockResolvedValueOnce({ data: { id: 'uuid', name: 'casual' }, error: null })
      supabase._chain.maybeSingle.mockResolvedValueOnce({ data: { id: 'another' }, error: null })
      await expect(service.updateStyle('uuid', { name: 'elegant' })).rejects.toBeInstanceOf(ConflictException)
    })

    it('throws 500 when uniqueness check fails', async () => {
      supabase._chain.single.mockResolvedValueOnce({ data: { id: 'uuid', name: 'casual' }, error: null })
      supabase._chain.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'db' } })
      await expect(service.updateStyle('uuid', { name: 'elegant' })).rejects.toBeInstanceOf(
        InternalServerErrorException,
      )
    })
  })
})
