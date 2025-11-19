import { Test, TestingModule } from '@nestjs/testing'
import { ItemCategoriesController } from './item-categories.controller'
import { ItemCategoriesService } from './item-categories.service'
import { NotFoundException } from '@nestjs/common'

describe('ItemCategoriesController', () => {
  let controller: ItemCategoriesController
  let service: jest.Mocked<ItemCategoriesService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemCategoriesController],
      providers: [
        {
          provide: ItemCategoriesService,
          useValue: {
            listAll: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<ItemCategoriesController>(ItemCategoriesController)
    service = module.get(ItemCategoriesService)
  })

  it('should return list on success', async () => {
    const data = [{ id: '1', name: 'top', display_name: 'Top', is_required: true }]
    service.listAll.mockResolvedValueOnce(data as any)
    const res = await controller.listItemCategories()
    expect(res).toEqual(data)
  })

  it('should propagate NotFoundException', async () => {
    service.listAll.mockRejectedValueOnce(new NotFoundException('No item categories found'))
    await expect(controller.listItemCategories()).rejects.toBeInstanceOf(NotFoundException)
  })
})
