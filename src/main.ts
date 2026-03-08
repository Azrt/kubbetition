import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SWAGGER_BEARER_TOKEN } from './app.constants';
import {
  ClassSerializerInterceptor,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueryFailedExceptionFilter } from './common/filters/query-failed-exception.filter';
import { useContainer } from 'class-validator';
import { DataSource } from 'typeorm';
import { seedDatabase } from './database/seed';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());

  // Trust proxy so rate limiting uses correct client IP (e.g. X-Forwarded-For)
  app.set('trust proxy', 1);
  
  // Run database seeding if conditions are met
  try {
    const dataSource = app.get(DataSource);
    await seedDatabase(dataSource);
  } catch (error) {
    console.error('Failed to seed database:', error);
    // Continue with app startup even if seeding fails
  }

  const configService = app.get(ConfigService);
  const allowedOriginsRaw = configService.get<string>('CORS_ALLOWED_ORIGINS');
  const allowedOrigins = allowedOriginsRaw
    ? allowedOriginsRaw.split(',').map(o => o.trim()).filter(Boolean)
    : [];

  app.enableCors({
    allowedHeaders: ["content-type", "authorization"],
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
  });

  app.useGlobalFilters(new QueryFailedExceptionFilter());

  // enable validation globally
  // this is from NestJS docs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
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

  if (configService.get('NODE_ENV') !== 'production') {
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
  }

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  await app.listen(3000);
}
bootstrap();
