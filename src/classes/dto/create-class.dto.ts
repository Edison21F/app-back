import { IsNotEmpty, IsString, IsNumber, Min, IsMongoId, IsDate, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateClassDto {
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
    description: 'Instructor ID',
  })
  @IsMongoId({ message: 'Invalid instructor ID format' })
  @IsNotEmpty({ message: 'Instructor ID is required' })
  @Type(() => Types.ObjectId)
  instructorId: Types.ObjectId;

  @ApiProperty({
    example: '2023-06-15T09:00:00.000Z',
    description: 'Class start date and time',
  })
  @IsNotEmpty({ message: 'Start date is required' })
  @Type(() => Date)
  @IsDate({ message: 'Invalid start date format' })
  startDate: Date;

  @ApiProperty({
    example: '2023-06-15T10:00:00.000Z',
    description: 'Class end date and time',
  })
  @IsNotEmpty({ message: 'End date is required' })
  @Type(() => Date)
  @IsDate({ message: 'Invalid end date format' })
  endDate: Date;

  @ApiProperty({
    example: 'Studio A',
    description: 'Class location',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    example: 'Please bring your own yoga mat',
    description: 'Additional notes for the class',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    example: 0,
    description: 'Current number of enrolled students',
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentCapacity?: number;

  @ApiProperty({
    example: 20,
    description: 'Maximum number of students',
    required: false,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxCapacity?: number;

  @ApiProperty({
    example: 'scheduled',
    description: 'Class status (scheduled, in-progress, completed, cancelled)',
    default: 'scheduled',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    example: 50.00,
    description: 'Class price (defaults to course base price if not specified)',
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({
    example: {
      roomNumber: '101',
      equipment: ['Yoga mats', 'Blocks'],
    },
    description: 'Additional metadata for the class',
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
