import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ProfilesController } from './profiles.controller'
import { ProfilesService } from './profiles.service'
import { SupabaseModule } from '../supabase/supabase.module'
import { AuthModule } from '../auth/auth.module'

/**
 * ProfilesModule wires up the ProfilesController and ProfilesService.
 * It imports SupabaseModule for DB access and ConfigModule for admin header checks.
 */
@Module({
  imports: [ConfigModule, SupabaseModule, AuthModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
