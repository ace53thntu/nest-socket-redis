import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { SocketIOAdapter } from './socket-io.adapter';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
  );

  const configService = app.get(ConfigService);
  const {
    http: { port },
  } = configService.get('app');

  app.enable('trust proxy');

  const logger = new Logger();

  // =========================================================
  // configure socket
  // =========================================================

  const redisIoAdapter = new SocketIOAdapter(app, configService);

  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  app.enableShutdownHooks();

  logger.log(`==========================================================`);

  await app.listen(port, '0.0.0.0');

  logger.log(`==========================================================`);

  logger.log(`Http Server running on ${await app.getUrl()}`, 'NestApplication');

  logger.log(`==========================================================`);
}
bootstrap();
