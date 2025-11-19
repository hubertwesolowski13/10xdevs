import { Test, TestingModule } from '@nestjs/testing'
import { StylesController } from './styles.controller'
import { StylesService } from './styles.service'
import { NotFoundException } from '@nestjs/common'

describe('StylesController', () => {
  let controller: StylesController
  let service: jest.Mocked<StylesService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StylesController],
      providers: [
        {
          provide: StylesService,
          useValue: { listAll: jest.fn() },
        },
      ],
    }).compile()

    controller = module.get<StylesController>(StylesController)
    service = module.get(StylesService)
  })

  it('returns list on success', async () => {
    const data = [
      { id: '1', name: 'casual', display_name: 'Casual' },
      { id: '2', name: 'elegant', display_name: 'Elegancki' },
    ]
    service.listAll.mockResolvedValueOnce(data as any)
    const res = await controller.listStyles()
    expect(res).toEqual(data)
  })

  it('propagates NotFoundException', async () => {
    service.listAll.mockRejectedValueOnce(new NotFoundException('No styles found'))
    await expect(controller.listStyles()).rejects.toBeInstanceOf(NotFoundException)
  })
})
