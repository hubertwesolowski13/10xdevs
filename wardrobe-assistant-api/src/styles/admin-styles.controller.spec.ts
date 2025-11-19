import { Test, TestingModule } from '@nestjs/testing'
import { AdminStylesController } from './admin-styles.controller'
import { StylesService } from './styles.service'
import { ConflictException, NotFoundException } from '@nestjs/common'

describe('AdminStylesController', () => {
  let controller: AdminStylesController
  let service: jest.Mocked<StylesService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminStylesController],
      providers: [
        {
          provide: StylesService,
          useValue: {
            createStyle: jest.fn(),
            updateStyle: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get(AdminStylesController)
    service = module.get(StylesService)
  })

  it('create: returns created row', async () => {
    const body = { name: 'casual', display_name: 'Casual' }
    const row = { id: '1', ...body }
    service.createStyle.mockResolvedValueOnce(row as any)
    await expect(controller.create(body as any)).resolves.toEqual(row)
  })

  it('create: propagates ConflictException', async () => {
    const body = { name: 'casual', display_name: 'Casual' }
    service.createStyle.mockRejectedValueOnce(new ConflictException('exists'))
    await expect(controller.create(body as any)).rejects.toBeInstanceOf(ConflictException)
  })

  it('update: returns updated row', async () => {
    const id = '11111111-1111-1111-1111-111111111111'
    const body = { display_name: 'Elegancki' }
    const row = { id, name: 'elegant', display_name: 'Elegancki' }
    service.updateStyle.mockResolvedValueOnce(row as any)
    await expect(controller.update(id, body as any)).resolves.toEqual(row)
  })

  it('update: propagates NotFoundException', async () => {
    const id = '11111111-1111-1111-1111-111111111111'
    const body = { display_name: 'X' }
    service.updateStyle.mockRejectedValueOnce(new NotFoundException('not found'))
    await expect(controller.update(id, body as any)).rejects.toBeInstanceOf(NotFoundException)
  })
})
