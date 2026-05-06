import './instrumentation';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { bufferLogs: false },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT ?? 3002;

  // Start listening with a timeout to prevent hanging
  const listenPromise = app.listen(port, '0.0.0.0');
  const timeoutPromise = new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('App.listen() timeout after 90 seconds')), 90000)
  );

  await Promise.race([listenPromise, timeoutPromise]);
  console.log(`Worker running on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
