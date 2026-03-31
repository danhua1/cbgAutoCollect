import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  LoggerService,
  NestInterceptor,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.originalUrl || request.url;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const statusCode = context.switchToHttp().getResponse().statusCode;
          const duration = Date.now() - startedAt;
          this.logger.log(`${method} ${url} ${statusCode} ${duration}ms`, 'HTTP');
        },
        error: (error) => {
          const statusCode = context.switchToHttp().getResponse().statusCode || 500;
          const duration = Date.now() - startedAt;
          const message = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(`${method} ${url} ${statusCode} ${duration}ms - ${message}`, undefined, 'HTTP');
        },
      }),
    );
  }
}
