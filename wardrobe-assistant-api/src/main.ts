import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  // Global validation pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  // Enable CORS for mobile app consumption
  app.enableCors({ origin: true, credentials: true })

  // Swagger setup
  const swaggerEnabled = configService.get('SWAGGER_ENABLED') !== 'false'
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Wardrobe Assistant API')
      .setDescription('API documentation for Wardrobe Assistant (auth, profiles, items, styles, admin, creations)')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('profiles', 'Endpoints for user profiles')
      .addTag('item_categories', 'Endpoints for wardrobe item categories')
      .addTag('styles', 'Endpoints for styles used in creations')
      .addTag('creations', 'Endpoints for generated outfit creations')
      .addTag('admin/item_categories', 'Admin endpoints for item categories')
      .addTag('admin/styles', 'Admin endpoints for styles')
      .build()

    const document = SwaggerModule.createDocument(app, config)
    const path: string = configService.get('SWAGGER_PATH') || 'docs'
    SwaggerModule.setup(path, app, document)
  }

  const port = Number(configService.get('PORT')) || 3000
  await app.listen(port)
}
bootstrap()
