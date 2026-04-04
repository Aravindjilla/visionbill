import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import helmet from 'helmet';

let app: any;

export default async (req: any, res: any) => {
  if (!app) {
    app = await NestFactory.create(AppModule, {
      logger: WinstonModule.createLogger({
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.ms(),
              winston.format.colorize(),
              winston.format.simple(),
            ),
          }),
        ],
      }),
    });

    app.use(helmet());
    app.enableCors();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new LoggingInterceptor());
    
    const { AllExceptionsFilter } = require('../src/common/filters/all-exceptions.filter');
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
  }

  const instance = app.getHttpAdapter().getInstance();
  return instance(req, res);
};
