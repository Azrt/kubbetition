import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SWAGGER_BEARER_TOKEN } from './app.constants';
import { ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    allowedHeaders: ["content-type"],
    origin: "http://localhost:3000",
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
  // app.stat
  // app.useStaticAssets(join(__dirname, '..', 'public'), {
  //   index: false,
  //   prefix: '/public',
  // });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  await app.listen(3000);
}
bootstrap();
