import './instrumentation';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from './app.module';

async function bootstrap() {
  console.log('Starting bootstrap...');

  // Create app with timeout to catch module initialization hangs
  let app: NestFastifyApplication;
  try {
    const createPromise = NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter(),
      { bufferLogs: false },
    );
    const createTimeoutPromise = new Promise<NestFastifyApplication>((_, reject) =>
      setTimeout(() => reject(new Error('NestFactory.create() timeout after 60 seconds')), 60000)
    );
    app = await Promise.race([createPromise, createTimeoutPromise]);
    console.log('Application created successfully');
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

  // Start listening with a timeout to prevent hanging
  console.log(`Starting to listen on port ${port}...`);
  const listenPromise = app.listen(port, '0.0.0.0');
  const timeoutPromise = new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('App.listen() timeout after 300 seconds')), 300000)
  );

  await Promise.race([listenPromise, timeoutPromise]);
  console.log(`Worker running on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
