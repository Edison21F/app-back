import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      // Increment login attempts
      await this.usersService.incrementLoginAttempts(user.id);
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // Reset login attempts on successful login
    await this.usersService.resetLoginAttempts(user.id);
    
    // Update last login timestamp
    await this.usersService.updateLastLogin(user.id);
    
    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    const payload = { 
      sub: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
    };
    
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(registerDto: RegisterDto) {
    const { password, ...userData } = registerDto;
    
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(userData.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = await this.usersService.create({
      ...userData,
      password: hashedPassword,
    });
    
    // Generate JWT
    const payload = { 
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
      businessId: newUser.businessId,
    };
    
    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        businessId: newUser.businessId,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      // Don't reveal that email doesn't exist
      return { message: 'If the email exists, a reset link has been sent' };
    }
    
    // Generate reset token
    const resetToken = uuidv4();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // Token expires in 1 hour
    
    // Save token to user
    await this.usersService.updateResetToken(user.id, resetToken, resetExpires);
    
    // In a real app, you would send an email with the reset link
    // For this example, we'll just return the token (would be sent in email)
    
    return { 
      message: 'If the email exists, a reset link has been sent',
      // Only for development, would not be included in production
      resetToken,
    };
  }

  async resetPassword(resetDto: ResetPasswordDto) {
    const { token, password } = resetDto;
    
    // Find user with valid reset token
    const user = await this.usersService.findByResetToken(token);
    
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    
    // Check if token is expired
    if (new Date() > user.resetPasswordExpires) {
      throw new BadRequestException('Reset token has expired');
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password and clear reset token
    await this.usersService.resetPassword(user.id, hashedPassword);
    
    return { message: 'Password has been reset successfully' };
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User account is inactive or not found');
      }
      
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
