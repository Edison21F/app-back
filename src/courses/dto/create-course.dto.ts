import { IsNotEmpty, IsString, IsNumber, Min, Max, IsMongoId, IsArray, IsOptional, IsBoolean, IsUrl, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateCourseDto {
  @ApiProperty({
    example: 'Yoga for Beginners',
    description: 'Course name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Course name is required' })
  name: string;

  @ApiProperty({
    example: 'Introduction to yoga for beginners with focus on fundamentals and basic poses',
    description: 'Course description',
  })
  @IsString()
  @IsNotEmpty({ message: 'Course description is required' })
  description: string;

  @ApiProperty({
    example: 'class',
    description: 'Course type (class, appointment, consultation)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Course type is required' })
  type: string;

  @ApiProperty({
    example: '60d0fe4f5311236168a109ca',
    description: 'Business ID',
  })
  @IsMongoId({ message: 'Invalid business ID format' })
  @IsNotEmpty({ message: 'Business ID is required' })
  @Type(() => Types.ObjectId)
  businessId: Types.ObjectId;

  @ApiProperty({
    example: 50.00,
    description: 'Base price for the course',
  })
  @IsNumber()
  @Min(0, { message: 'Base price must be at least 0' })
  @IsNotEmpty({ message: 'Base price is required' })
  basePrice: number;

  @ApiProperty({
    example: 60,
    description: 'Duration in minutes',
  })
  @IsNumber()
  @Min(1, { message: 'Duration must be at least 1 minute' })
  @IsNotEmpty({ message: 'Duration is required' })
  durationMinutes: number;

  @ApiProperty({
    example: 20,
    description: 'Maximum capacity (number of students)',
  })
  @IsNumber()
  @Min(1, { message: 'Max capacity must be at least 1' })
  @IsNotEmpty({ message: 'Max capacity is required' })
  maxCapacity: number;

  @ApiProperty({
    example: ['60d0fe4f5311236168a109cb', '60d0fe4f5311236168a109cc'],
    description: 'List of instructor IDs',
    type: [String],
  })
  @IsArray()
  @IsMongoId({ each: true, message: 'Each instructor ID must be a valid MongoDB ID' })
  @Type(() => Types.ObjectId)
  @IsOptional()
  instructors?: Types.ObjectId[];

  @ApiProperty({
    example: true,
    description: 'Course active status',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: ['yoga', 'beginner', 'wellness'],
    description: 'Tags for categorizing and searching courses',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    example: 'https://example.com/course-image.svg',
    description: 'URL to course image',
  })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    example: {
      equipmentNeeded: ['Yoga mat', 'Water bottle'],
      experienceLevel: 'Beginner',
    },
    description: 'Additional requirements for the course',
  })
  @IsObject()
  @IsOptional()
  requirements?: Record<string, any>;

  @ApiProperty({
    example: {
      targetAudience: 'Adults',
      benefits: ['Improved flexibility', 'Stress reduction'],
    },
    description: 'Additional metadata for the course',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
