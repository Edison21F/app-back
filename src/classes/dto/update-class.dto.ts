import { IsString, IsNumber, Min, IsMongoId, IsDate, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class UpdateClassDto {
  @ApiProperty({
    example: '60d0fe4f5311236168a109cc',
    description: 'Instructor ID',
    required: false,
  })
  @IsMongoId({ message: 'Invalid instructor ID format' })
  @IsOptional()
  @Type(() => Types.ObjectId)
  instructorId?: Types.ObjectId;

  @ApiProperty({
    example: '2023-06-15T10:00:00.000Z',
    description: 'Class start date and time',
    required: false,
  })
  @Type(() => Date)
  @IsDate({ message: 'Invalid start date format' })
  @IsOptional()
  startDate?: Date;

  @ApiProperty({
    example: '2023-06-15T11:00:00.000Z',
    description: 'Class end date and time',
    required: false,
  })
  @Type(() => Date)
  @IsDate({ message: 'Invalid end date format' })
  @IsOptional()
  endDate?: Date;

  @ApiProperty({
    example: 'Studio B',
    description: 'Class location',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    example: 'Yoga mats will be provided',
    description: 'Additional notes for the class',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    example: 25,
    description: 'Maximum number of students',
    required: false,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxCapacity?: number;

  @ApiProperty({
    example: 'in-progress',
    description: 'Class status (scheduled, in-progress, completed, cancelled)',
    required: false,
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    example: 55.00,
    description: 'Class price',
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({
    example: {
      roomNumber: '102',
      equipment: ['Yoga mats', 'Blocks', 'Straps'],
    },
    description: 'Additional metadata for the class',
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
