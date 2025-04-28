import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ValidateSchemaMiddleware implements NestMiddleware {
  constructor(private schema: ZodSchema) {}

  use(req: Request, res: Response, next: NextFunction) {
    try {
      this.schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(error.errors.map((e) => e.message));
      }
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}
