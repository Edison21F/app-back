import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/decorators/roles.decorator';

export class UpdateUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
    required: false,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'User phone number',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'User password',
    required: false,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsOptional()
  password?: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.INSTRUCTOR,
    description: 'User role',
    required: false,
  })
  @IsEnum(UserRole, { message: 'Invalid user role' })
  @IsOptional()
  role?: UserRole;

  @ApiProperty({
    example: true,
    description: 'Whether the user is active',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Extra fields for receptionists
  @ApiProperty({
    example: true,
    description: 'Whether the receptionist can accept payments',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  canAcceptPayments?: boolean;

  // Extra fields for instructors/professionals
  @ApiProperty({
    example: ['Yoga', 'Pilates'],
    description: 'Specialties of the instructor/professional',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialties?: string[];

  @ApiProperty({
    example: 'Experienced yoga instructor with 10 years of practice',
    description: 'Bio of the instructor/professional',
    required: false,
  })
  @IsString()
  @IsOptional()
  bio?: string;
}
