import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies['token'];

    if (!token) return false;

    try {
      const payload = await this.jwtService.verifyAsync(token);
      //@ts-ignore
      req.user = payload;
      return true;
    } catch {
      return false;
    }
  }
}
