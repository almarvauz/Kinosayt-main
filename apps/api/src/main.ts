import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false })
  );

  app.enableCors({
    origin: process.env.NEXT_PUBLIC_API_URL ? ["http://localhost:3000", process.env.NEXT_PUBLIC_API_URL] : true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  const port = process.env.PORT ?? 3001;
  await app.listen(port, "0.0.0.0");
  console.log(`API running on http://0.0.0.0:${port}`);
}

bootstrap();
