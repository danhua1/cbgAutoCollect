import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as path from 'path';
import * as fs from 'fs';
import * as winston from 'winston';

const logsDir = path.resolve(process.cwd(), 'logs');
fs.mkdirSync(logsDir, { recursive: true });

@Module({
  imports: [
    WinstonModule.forRoot({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, context, stack }) => {
          const contextText = context ? `[${context}] ` : '';
          const stackText = stack ? `\n${stack}` : '';
          return `${timestamp} ${level.toUpperCase()} ${contextText}${message}${stackText}`;
        }),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: path.join(logsDir, 'combined.log'),
        }),
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
        }),
      ],
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
