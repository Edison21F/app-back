import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant ID from request
    // Priority: 1. URL query param 2. Request header 3. User's business from JWT
    
    let tenantId = req.query.tenantId as string;
    
    if (!tenantId) {
      tenantId = req.headers['x-tenant-id'] as string;
    }
    
    if (!tenantId && req.user) {
      tenantId = (req.user as any).businessId;
    }
    
    if (tenantId) {
      // Attach tenant ID to request object for use in services
      (req as any).tenantId = tenantId;
    }
    
    next();
  }
}
