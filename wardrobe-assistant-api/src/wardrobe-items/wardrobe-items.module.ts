import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { SupabaseModule } from '../supabase/supabase.module'
import { WardrobeItemsController } from './wardrobe-items.controller'
import { WardrobeItemsService } from './wardrobe-items.service'

@Module({
  imports: [AuthModule, SupabaseModule],
  controllers: [WardrobeItemsController],
  providers: [WardrobeItemsService],
  exports: [WardrobeItemsService],
})
export class WardrobeItemsModule {}
