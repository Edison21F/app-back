// src/auth/strategies/jwt.strategy.ts

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { JwtPayload } from './interface/jwt-payload.inerface'; // te lo creo abajo también

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // extrae el token del Authorization: Bearer <token>
      secretOrKey: process.env.TOKEN_SECRET || 'secret', // clave secreta
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.authService.profile(payload.id);
    if (!user) {
      throw new Error('Unauthorized');
    }
    return user; // este objeto estará disponible en @Request() req.user
  }
}
