import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsMongoId, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/decorators/roles.decorator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'User phone number',
  })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.STUDENT,
    description: 'User role',
    default: UserRole.STUDENT,
  })
  @IsEnum(UserRole, { message: 'Invalid user role' })
  @IsOptional()
  role?: UserRole;

  @ApiProperty({
    example: '60d0fe4f5311236168a109ca',
    description: 'Business ID',
  })
  @IsMongoId({ message: 'Invalid business ID format' })
  @IsNotEmpty({ message: 'Business ID is required' })
  businessId: string;

  @ApiProperty({
    example: true,
    description: 'Whether the user is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Extra fields for receptionists
  @ApiProperty({
    example: true,
    description: 'Whether the receptionist can accept payments',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  canAcceptPayments?: boolean;

  // Extra fields for instructors/professionals
  @ApiProperty({
    example: ['Yoga', 'Pilates'],
    description: 'Specialties of the instructor/professional',
    default: [],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialties?: string[];

  @ApiProperty({
    example: 'Experienced yoga instructor with 10 years of practice',
    description: 'Bio of the instructor/professional',
  })
  @IsString()
  @IsOptional()
  bio?: string;
}
