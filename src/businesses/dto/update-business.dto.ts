import { IsString, IsOptional, IsEmail, IsUrl, IsBoolean, IsObject, ValidateNested, IsArray, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class BusinessHoursDto {
  @ApiProperty({ example: '09:00' })
  @IsString()
  @IsOptional()
  open?: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  @IsOptional()
  close?: string;
}

export class UpdateBusinessDto {
  @ApiProperty({
    example: 'Fitness Center XYZ',
    description: 'Business name',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'gym',
    description: 'Business type (academy, gym, clinic, etc.)',
    required: false,
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    example: 'A modern fitness center with state-of-the-art equipment',
    description: 'Business description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: '123 Main St',
    description: 'Business address',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    example: 'New York',
    description: 'City',
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    example: 'NY',
    description: 'State',
    required: false,
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({
    example: '10001',
    description: 'Zip code',
    required: false,
  })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiProperty({
    example: 'USA',
    description: 'Country',
    required: false,
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Business phone number',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'info@fitnesscenter.com',
    description: 'Business email',
    required: false,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: 'https://www.fitnesscenter.com',
    description: 'Business website',
    required: false,
  })
  @IsUrl({}, { message: 'Please provide a valid URL' })
  @IsOptional()
  website?: string;

  @ApiProperty({
    example: 'https://www.fitnesscenter.com/logo.svg',
    description: 'Business logo URL',
    required: false,
  })
  @IsUrl({}, { message: 'Please provide a valid URL' })
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the business is active',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
    },
    description: 'Business hours',
    required: false,
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessHoursDto)
  businessHours?: Record<string, BusinessHoursDto>;

  @ApiProperty({
    example: false,
    description: 'Whether Stripe payments are enabled',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  stripeEnabled?: boolean;

  @ApiProperty({
    example: 'acct_123456789',
    description: 'Stripe account ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  stripeAccountId?: string;

  @ApiProperty({
    example: true,
    description: 'Whether manual payments are enabled',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  manualPaymentsEnabled?: boolean;

  @ApiProperty({
    example: 'premium',
    description: 'Subscription plan',
    required: false,
  })
  @IsString()
  @IsOptional()
  subscriptionPlan?: string;

  @ApiProperty({
    example: {
      color: '#FF5733',
      allowGuests: true,
      sendEmailReminders: true,
    },
    description: 'Custom business settings',
    required: false,
  })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}
