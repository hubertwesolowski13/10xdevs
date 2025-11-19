import { Test, TestingModule } from '@nestjs/testing'
import { AdminItemCategoriesController } from './admin-item-categories.controller'
import { ItemCategoriesService } from './item-categories.service'
import { ConflictException, NotFoundException } from '@nestjs/common'

// We don't execute guards here; controller unit tests assume guard passed.

describe('AdminItemCategoriesController', () => {
  let controller: AdminItemCategoriesController
  let service: jest.Mocked<ItemCategoriesService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminItemCategoriesController],
      providers: [
        {
          provide: ItemCategoriesService,
          useValue: {
            createCategory: jest.fn(),
            updateCategory: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get(AdminItemCategoriesController)
    service = module.get(ItemCategoriesService)
  })

  it('create: returns created row', async () => {
    const body = { name: 'headwear', display_name: 'Okrycie głowy', is_required: false }
    const row = { id: '1', ...body }
    service.createCategory.mockResolvedValueOnce(row as any)
    await expect(controller.create(body as any)).resolves.toEqual(row)
  })

  it('create: propagates ConflictException', async () => {
    const body = { name: 'headwear', display_name: 'Okrycie głowy', is_required: false }
    service.createCategory.mockRejectedValueOnce(new ConflictException('exists'))
    await expect(controller.create(body as any)).rejects.toBeInstanceOf(ConflictException)
  })

  it('update: returns updated row', async () => {
    const id = '11111111-1111-1111-1111-111111111111'
    const body = { display_name: 'Okrycie górne' }
    const row = { id, name: 'top', display_name: 'Okrycie górne', is_required: true }
    service.updateCategory.mockResolvedValueOnce(row as any)
    await expect(controller.update(id, body as any)).resolves.toEqual(row)
  })

  it('update: propagates NotFoundException', async () => {
    const id = '11111111-1111-1111-1111-111111111111'
    const body = { display_name: 'X' }
    service.updateCategory.mockRejectedValueOnce(new NotFoundException('not found'))
    await expect(controller.update(id, body as any)).rejects.toBeInstanceOf(NotFoundException)
  })
})
