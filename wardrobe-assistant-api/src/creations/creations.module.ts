import { Module } from '@nestjs/common'
import { CreationsController } from './creations.controller'
import { CreationsService } from './creations.service'

/**
 * Module for handling creation-related functionality.
 * Registers the controller and service for dependency injection.
 */
@Module({
  controllers: [CreationsController],
  providers: [CreationsService],
  exports: [CreationsService],
})
export class CreationsModule {}
