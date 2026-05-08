import './instrumentation';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from './app.module';

// Global error handlers for debugging RabbitMQ issues
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT_EXCEPTION]', err);
});

process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED_REJECTION]', err);
});

async function bootstrap() {
  let app: NestFastifyApplication;
  try {
    const createPromise = NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter(),
      { bufferLogs: false },
    );
    const createTimeoutPromise = new Promise<NestFastifyApplication>((_, reject) =>
      setTimeout(() => reject(new Error('NestFactory.create() timeout after 60 seconds')), 60000),
    );
    app = await Promise.race([createPromise, createTimeoutPromise]);
  } catch (err) {
    console.error('Failed to create application:', err instanceof Error ? err.message : err);
    throw err;
  }

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT ?? 3002;

  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
  console.log('[SIGTERM] Graceful shutdown initiated');
  setTimeout(() => {
    process.exit(0);
  }, 5000);
});
