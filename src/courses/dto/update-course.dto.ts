import { IsString, IsNumber, Min, IsMongoId, IsArray, IsOptional, IsBoolean, IsUrl, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class UpdateCourseDto {
  @ApiProperty({
    example: 'Advanced Yoga',
    description: 'Course name',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'Advanced yoga techniques for experienced practitioners',
    description: 'Course description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'class',
    description: 'Course type (class, appointment, consultation)',
    required: false,
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    example: '60d0fe4f5311236168a109ca',
    description: 'Business ID',
    required: false,
  })
  @IsMongoId({ message: 'Invalid business ID format' })
  @IsOptional()
  @Type(() => Types.ObjectId)
  businessId?: Types.ObjectId;

  @ApiProperty({
    example: 75.00,
    description: 'Base price for the course',
    required: false,
  })
  @IsNumber()
  @Min(0, { message: 'Base price must be at least 0' })
  @IsOptional()
  basePrice?: number;

  @ApiProperty({
    example: 90,
    description: 'Duration in minutes',
    required: false,
  })
  @IsNumber()
  @Min(1, { message: 'Duration must be at least 1 minute' })
  @IsOptional()
  durationMinutes?: number;

  @ApiProperty({
    example: 15,
    description: 'Maximum capacity (number of students)',
    required: false,
  })
  @IsNumber()
  @Min(1, { message: 'Max capacity must be at least 1' })
  @IsOptional()
  maxCapacity?: number;

  @ApiProperty({
    example: ['60d0fe4f5311236168a109cb', '60d0fe4f5311236168a109cc'],
    description: 'List of instructor IDs',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsMongoId({ each: true, message: 'Each instructor ID must be a valid MongoDB ID' })
  @Type(() => Types.ObjectId)
  @IsOptional()
  instructors?: Types.ObjectId[];

  @ApiProperty({
    example: false,
    description: 'Course active status',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: ['yoga', 'advanced', 'wellness'],
    description: 'Tags for categorizing and searching courses',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    example: 'https://example.com/course-image.svg',
    description: 'URL to course image',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    example: {
      equipmentNeeded: ['Yoga mat', 'Yoga blocks', 'Strap'],
      experienceLevel: 'Advanced',
    },
    description: 'Additional requirements for the course',
    required: false,
  })
  @IsObject()
  @IsOptional()
  requirements?: Record<string, any>;

  @ApiProperty({
    example: {
      targetAudience: 'Experienced yoga practitioners',
      benefits: ['Advanced flexibility', 'Mind-body harmony'],
    },
    description: 'Additional metadata for the course',
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
