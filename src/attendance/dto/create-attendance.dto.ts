import { IsNotEmpty, IsMongoId, IsDate, IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateAttendanceDto {
  @ApiProperty({
    example: '60d0fe4f5311236168a109ca',
    description: 'Business ID',
  })
  @IsMongoId({ message: 'Invalid business ID format' })
  @Type(() => Types.ObjectId)
  businessId: Types.ObjectId;

  @ApiProperty({
    example: '60d0fe4f5311236168a109cb',
    description: 'User ID',
  })
  @IsMongoId({ message: 'Invalid user ID format' })
  @IsNotEmpty({ message: 'User ID is required' })
  @Type(() => Types.ObjectId)
  userId: Types.ObjectId;

  @ApiProperty({
    example: 'class',
    description: 'Reference type (class or appointment)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Reference type is required' })
  @IsEnum(['class', 'appointment'], { message: 'Reference type must be "class" or "appointment"' })
  referenceType: string;

  @ApiProperty({
    example: '60d0fe4f5311236168a109cc',
    description: 'Reference ID (class or appointment ID)',
  })
  @IsMongoId({ message: 'Invalid reference ID format' })
  @IsNotEmpty({ message: 'Reference ID is required' })
  @Type(() => Types.ObjectId)
  referenceId: Types.ObjectId;

  @ApiProperty({
    example: '2023-06-15T10:00:00.000Z',
    description: 'Date of attendance',
  })
  @IsNotEmpty({ message: 'Date is required' })
  @Type(() => Date)
  @IsDate({ message: 'Invalid date format' })
  date: Date;

  @ApiProperty({
    example: 'present',
    description: 'Attendance status (present, absent, late, excused)',
    default: 'present',
  })
  @IsString()
  @IsEnum(['present', 'absent', 'late', 'excused'], { message: 'Status must be "present", "absent", "late", or "excused"' })
  @IsOptional()
  status?: string;

  @ApiProperty({
    example: '60d0fe4f5311236168a109cd',
    description: 'ID of user who marked attendance (instructor or receptionist)',
    required: false,
  })
  @IsMongoId({ message: 'Invalid marker ID format' })
  @IsOptional()
  @Type(() => Types.ObjectId)
  markedBy?: Types.ObjectId;

  @ApiProperty({
    example: 'Student was 10 minutes late',
    description: 'Additional notes about attendance',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    example: {
      reason: 'Traffic',
      followUp: true,
    },
    description: 'Additional metadata for the attendance record',
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
