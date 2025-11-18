import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { SupabaseModule } from '../supabase/supabase.module'
import { JwtAuthGuard } from './jwt-auth.guard'
import { JwtOrAdminGuard } from './jwt-or-admin.guard'

@Module({
  imports: [SupabaseModule, ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, JwtOrAdminGuard],
  exports: [AuthService, JwtAuthGuard, JwtOrAdminGuard],
})
export class AuthModule {}
