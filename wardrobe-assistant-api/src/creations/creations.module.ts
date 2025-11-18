import { Module } from '@nestjs/common'
import { CreationsController } from './creations.controller'
import { CreationsService } from './creations.service'
import { AuthModule } from '../auth/auth.module'

/**
 * Module for handling creation-related functionality.
 * Registers the controller and service for dependency injection.
 */
@Module({
  imports: [AuthModule],
  controllers: [CreationsController],
  providers: [CreationsService],
  exports: [CreationsService],
})
export class CreationsModule {}
