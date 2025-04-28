import { IsNotEmpty, IsString, IsNumber, IsMongoId, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StripePaymentDto {
  @ApiProperty({
    example: 75.00,
    description: 'Payment amount',
  })
  @IsNumber()
  @IsNotEmpty({ message: 'Amount is required' })
  amount: number;

  @ApiProperty({
    example: 'USD',
    description: 'Currency code',
    default: 'usd',
    required: false,
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    example: '60d0fe4f5311236168a109ca',
    description: 'Business ID',
  })
  @IsString()
  @IsNotEmpty({ message: 'Business ID is required' })
  businessId: string;

  @ApiProperty({
    example: '60d0fe4f5311236168a109cb',
    description: 'User ID (student/client)',
  })
  @IsString()
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @ApiProperty({
    example: 'Payment for yoga class - June 15',
    description: 'Payment description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: {
      referenceType: 'class',
      referenceId: '60d0fe4f5311236168a109cd',
      productName: 'Yoga Class',
    },
    description: 'Additional metadata for the payment',
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
