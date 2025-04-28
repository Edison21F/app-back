import { IsString, IsNumber, Min, IsMongoId, IsDate, IsOptional, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class UpdateAppointmentDto {
  @ApiProperty({
    example: '60d0fe4f5311236168a109cc',
    description: 'Professional ID',
    required: false,
  })
  @IsMongoId({ message: 'Invalid professional ID format' })
  @IsOptional()
  @Type(() => Types.ObjectId)
  professionalId?: Types.ObjectId;

  @ApiProperty({
    example: '60d0fe4f5311236168a109cd',
    description: 'Client ID',
    required: false,
  })
  @IsMongoId({ message: 'Invalid client ID format' })
  @IsOptional()
  @Type(() => Types.ObjectId)
  clientId?: Types.ObjectId;

  @ApiProperty({
    example: '2023-06-15T10:00:00.000Z',
    description: 'Appointment start date and time',
    required: false,
  })
  @Type(() => Date)
  @IsDate({ message: 'Invalid start date format' })
  @IsOptional()
  startDate?: Date;

  @ApiProperty({
    example: '2023-06-15T11:00:00.000Z',
    description: 'Appointment end date and time',
    required: false,
  })
  @Type(() => Date)
  @IsDate({ message: 'Invalid end date format' })
  @IsOptional()
  endDate?: Date;

  @ApiProperty({
    example: 'Room 204',
    description: 'Appointment location',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    example: 'Follow-up consultation',
    description: 'Additional notes for the appointment',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    example: 'confirmed',
    description: 'Appointment status (scheduled, confirmed, in-progress, completed, cancelled, no-show)',
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    example: 85.00,
    description: 'Appointment price',
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({
    example: '60d0fe4f5311236168a109ce',
    description: 'Payment ID',
    required: false,
  })
  @IsMongoId({ message: 'Invalid payment ID format' })
  @IsOptional()
  @Type(() => Types.ObjectId)
  paymentId?: Types.ObjectId;

  @ApiProperty({
    example: true,
    description: 'Whether the appointment is paid',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiProperty({
    example: {
      clientPreferences: 'Prefers afternoon appointments',
      notes: 'Client has mobility issues',
    },
    description: 'Additional metadata for the appointment',
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
