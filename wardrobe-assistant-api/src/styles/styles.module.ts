import { Module } from '@nestjs/common'
import { StylesController } from './styles.controller'
import { StylesService } from './styles.service'
import { SupabaseModule } from '../supabase/supabase.module'
import { AuthModule } from '../auth/auth.module'
import { AdminStylesController } from './admin-styles.controller'

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [StylesController, AdminStylesController],
  providers: [StylesService],
  exports: [StylesService],
})
export class StylesModule {}
