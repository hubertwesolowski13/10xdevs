import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import * as path from 'path'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { CreationsModule } from './creations/creations.module'
import { SupabaseModule } from './supabase/supabase.module'
import { AdminModule } from './admin/admin.module'
import { AuthModule } from './auth/auth.module'

@Module({
  imports: [
    // Load environment variables from .env files
    ConfigModule.forRoot({
      isGlobal: true,
      // Try multiple locations to support running from package dir or monorepo root and after build
      envFilePath: [
        path.resolve(process.cwd(), '.env'), // current working directory
        path.resolve(__dirname, '../.env'), // when running compiled code from dist
      ],
      // ignoreEnvFile: process.env.NODE_ENV === 'production', // Uncomment if using real env in prod
      // expandVariables: true, // Enable if referencing other vars like ${OTHER}
    }),
    AdminModule,
    SupabaseModule,
    CreationsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
