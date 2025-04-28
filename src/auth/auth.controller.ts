// src/auth/auth.controller.ts

import { 
    Controller, 
    Post, 
    Body, 
    Res, 
    Req, 
    Get, 
    UseGuards, 
    HttpCode 
  } from '@nestjs/common';
  import { AuthService } from './auth.service';
  import { RegisterDto } from './dto/register.dto';
  import { LoginDto } from './dto/login.dto';
  import { Response, Request } from 'express';
  import { AuthGuard } from '@nestjs/passport'; // usamos el de passport directamente
  
  @Controller('auth')
  export class AuthController {
    constructor(private readonly authService: AuthService) {}
  
    @Post('register')
    async register(@Body() registerDto: RegisterDto, @Res() res: Response) {
      const data = await this.authService.register(registerDto);
      res.cookie('token', data.token, {
        httpOnly: true,
        secure: true, // asegúrate que en dev no cause problemas
        sameSite: 'none',
      });
      return res.json({ user: data.user });
    }
  
    @Post('login')
    @HttpCode(200)
    async login(@Body() loginDto: LoginDto, @Res() res: Response) {
      const data = await this.authService.login(loginDto);
      res.cookie('token', data.token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });
      return res.json({ user: data.user });
    }
  
    @Post('logout')
    @HttpCode(200)
    logout(@Res() res: Response) {
      res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });
      return res.json({ message: 'Logged out successfully' });
    }
  
    @Get('profile')
    @UseGuards(AuthGuard('jwt')) // <-- usamos el strategy 'jwt' que creaste
    async profile(@Req() req: any) {
      return req.user; // porque Passport ya te entrega el usuario validado en req.user
    }
  }
  