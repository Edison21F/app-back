import { IsNotEmpty, IsString, IsNumber, Min, IsMongoId, IsDate, IsOptional, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateAppointmentDto {
  @ApiProperty({
    example: '60d0fe4f5311236168a109ca',
    description: 'Course ID',
  })
  @IsMongoId({ message: 'Invalid course ID format' })
  @IsNotEmpty({ message: 'Course ID is required' })
  @Type(() => Types.ObjectId)
  courseId: Types.ObjectId;

  @ApiProperty({
    example: '60d0fe4f5311236168a109cb',
    description: 'Business ID',
  })
  @IsMongoId({ message: 'Invalid business ID format' })
  @IsNotEmpty({ message: 'Business ID is required' })
  @Type(() => Types.ObjectId)
  businessId: Types.ObjectId;

  @ApiProperty({
    example: '60d0fe4f5311236168a109cc',
    description: 'Professional ID',
  })
  @IsMongoId({ message: 'Invalid professional ID format' })
  @IsNotEmpty({ message: 'Professional ID is required' })
  @Type(() => Types.ObjectId)
  professionalId: Types.ObjectId;

  @ApiProperty({
    example: '60d0fe4f5311236168a109cd',
    description: 'Client ID',
  })
  @IsMongoId({ message: 'Invalid client ID format' })
  @IsNotEmpty({ message: 'Client ID is required' })
  @Type(() => Types.ObjectId)
  clientId: Types.ObjectId;

  @ApiProperty({
    example: '2023-06-15T09:00:00.000Z',
    description: 'Appointment start date and time',
  })
  @IsNotEmpty({ message: 'Start date is required' })
  @Type(() => Date)
  @IsDate({ message: 'Invalid start date format' })
  startDate: Date;

  @ApiProperty({
    example: '2023-06-15T10:00:00.000Z',
    description: 'Appointment end date and time',
  })
  @IsNotEmpty({ message: 'End date is required' })
  @Type(() => Date)
  @IsDate({ message: 'Invalid end date format' })
  endDate: Date;

  @ApiProperty({
    example: 'Room 203',
    description: 'Appointment location',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    example: 'Initial consultation for fitness plan',
    description: 'Additional notes for the appointment',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    example: 'scheduled',
    description: 'Appointment status (scheduled, confirmed, in-progress, completed, cancelled, no-show)',
    default: 'scheduled',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    example: 75.00,
    description: 'Appointment price (defaults to course base price if not specified)',
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({
    example: '60d0fe4f5311236168a109ce',
    description: 'Payment ID (if already paid)',
    required: false,
  })
  @IsMongoId({ message: 'Invalid payment ID format' })
  @IsOptional()
  @Type(() => Types.ObjectId)
  paymentId?: Types.ObjectId;

  @ApiProperty({
    example: false,
    description: 'Whether the appointment is paid',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiProperty({
    example: {
      clientPreferences: 'Prefers female instructor',
      referralSource: 'Website',
    },
    description: 'Additional metadata for the appointment',
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
