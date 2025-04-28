import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body, ip, user } = req;
    
    const userId = user ? user.id : 'anonymous';
    const tenantId = req.tenantId || 'none';
    const contentLength = req.get('content-length') || 0;
    
    const message = `${method} ${url} [${contentLength} bytes] [User: ${userId}] [Tenant: ${tenantId}] [IP: ${ip}]`;
    
    this.logger.log(message);
    
    const now = Date.now();
    
    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const delay = Date.now() - now;
        
        this.logger.log(
          `${response.statusCode} ${method} ${url} [${delay}ms]`
        );
      })
    );
  }
}
