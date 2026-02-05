import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SWAGGER_BEARER_TOKEN } from './app.constants';
import {
  ClassSerializerInterceptor,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { useContainer } from 'class-validator';
import { DataSource } from 'typeorm';
import { seedDatabase } from './database/seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Run database seeding if conditions are met
  try {
    const dataSource = app.get(DataSource);
    await seedDatabase(dataSource);
  } catch (error) {
    console.error('Failed to seed database:', error);
    // Continue with app startup even if seeding fails
  }

  app.enableCors({
    allowedHeaders: ["content-type", "authorization"],
    origin: true, // Allow all origins for mobile apps
    credentials: true,
  });

  // enable validation globally
  // this is from NestJS docs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector))
  );

  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'swagger', method: RequestMethod.ALL },
      { path: 'swagger-json', method: RequestMethod.ALL },
      { path: 'auth/google', method: RequestMethod.GET },
      { path: 'auth/google/redirect', method: RequestMethod.GET },
      { path: 'auth/google/login', method: RequestMethod.POST },
      { path: 'auth/refresh', method: RequestMethod.POST },
      { path: 'auth/me', method: RequestMethod.GET },
    ],
  });

  const config = new DocumentBuilder()
    .setTitle("Kubbetition")
    .setDescription("Kubbetition API")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        in: "header",
      },
      SWAGGER_BEARER_TOKEN
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("swagger", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  await app.listen(3000);
}
bootstrap();
