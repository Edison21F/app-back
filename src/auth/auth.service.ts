// src/auth/auth.service.ts

import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, username } = registerDto;

    const userFound = await this.userModel.findOne({ email });
    if (userFound) {
      throw new BadRequestException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new this.userModel({
      email,
      username,
      password: passwordHash,
    });

    const userSaved = await newUser.save();
    const token = await this.jwtService.signAsync({ id: userSaved._id });

    return {
      token,
      user: this.toUserResponse(userSaved),
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const userFound = await this.userModel.findOne({ email });
    if (!userFound) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, userFound.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.jwtService.signAsync({ id: userFound._id });

    return {
      token,
      user: this.toUserResponse(userFound),
    };
  }

  async profile(userId: string) {
    const userFound = await this.userModel.findById(userId);
    if (!userFound) {
      throw new NotFoundException('User not found');
    }

    return this.toUserResponse(userFound);
  }

  async verifyToken(token: string) {
    try {
      const decoded = await this.jwtService.verifyAsync<{ id: string }>(token);
      const userFound = await this.userModel.findById(decoded.id);
      if (!userFound) {
        throw new NotFoundException('User not found');
      }

      return this.toUserResponse(userFound);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  logout() {
    // logout en backend normalmente solo significa borrar cookie en frontend
    return true;
  }

  private toUserResponse(user: UserDocument) {
    return {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
  
}
