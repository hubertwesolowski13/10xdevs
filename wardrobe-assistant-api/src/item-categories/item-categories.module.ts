import { Module } from '@nestjs/common'
import { ItemCategoriesController } from './item-categories.controller'
import { ItemCategoriesService } from './item-categories.service'
import { SupabaseModule } from '../supabase/supabase.module'
import { AuthModule } from '../auth/auth.module'
import { AdminItemCategoriesController } from './admin-item-categories.controller'

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [ItemCategoriesController, AdminItemCategoriesController],
  providers: [ItemCategoriesService],
  exports: [ItemCategoriesService],
})
export class ItemCategoriesModule {}
