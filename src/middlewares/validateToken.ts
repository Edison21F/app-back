import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { TOKEN_SECRET } from '../../config.js';

interface JwtPayload {
  id: string; // Puedes ajustar esto según tu payload
  // otros campos si tu token tiene más información
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Aquí le agregamos el usuario al request
      // Necesitamos hacer un "cast" porque TS no sabe que req tiene "user"
      (req as any).user = decoded as JwtPayload;
      next();
    });
  }
}
