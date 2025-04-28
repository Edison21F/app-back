import { IsNotEmpty, IsString, IsNumber, IsMongoId, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreatePaymentDto {
  @ApiProperty({
    example: '60d0fe4f5311236168a109ca',
    description: 'Business ID',
  })
  @IsMongoId({ message: 'Invalid business ID format' })
  @IsNotEmpty({ message: 'Business ID is required' })
  @Type(() => Types.ObjectId)
  businessId: Types.ObjectId;

  @ApiProperty({
    example: '60d0fe4f5311236168a109cb',
    description: 'User ID (student/client)',
  })
  @IsMongoId({ message: 'Invalid user ID format' })
  @IsNotEmpty({ message: 'User ID is required' })
  @Type(() => Types.ObjectId)
  userId: Types.ObjectId;

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
  })
  @IsString()
  @IsNotEmpty({ message: 'Currency is required' })
  currency: string;

  @ApiProperty({
    example: 'stripe',
    description: 'Payment method (stripe, cash, bank_transfer)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Payment method is required' })
  paymentMethod: string;

  @ApiProperty({
    example: '60d0fe4f5311236168a109cc',
    description: 'Receptionist who received the payment (for manual payments)',
    required: false,
  })
  @IsMongoId({ message: 'Invalid receptionist ID format' })
  @IsOptional()
  @Type(() => Types.ObjectId)
  receivedBy?: Types.ObjectId;

  @ApiProperty({
    example: 'pi_1KdFu82eZvKYlo2C9idjDgx6',
    description: 'Stripe payment intent ID (for stripe payments)',
    required: false,
  })
  @IsString()
  @IsOptional()
  stripePaymentIntentId?: string;

  @ApiProperty({
    example: 'pending',
    description: 'Payment status (pending, completed, failed, refunded)',
    default: 'pending',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    example: 'Monthly gym membership fee',
    description: 'Payment description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'class',
    description: 'Reference type (class, appointment, subscription)',
    required: false,
  })
  @IsString()
  @IsOptional()
  referenceType?: string;

  @ApiProperty({
    example: '60d0fe4f5311236168a109cd',
    description: 'Reference ID (class or appointment ID)',
    required: false,
  })
  @IsMongoId({ message: 'Invalid reference ID format' })
  @IsOptional()
  @Type(() => Types.ObjectId)
  referenceId?: Types.ObjectId;

  @ApiProperty({
    example: 'https://stripe.com/receipts/123456',
    description: 'URL to payment receipt',
    required: false,
  })
  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @ApiProperty({
    example: {
      invoiceNumber: 'INV-2023-001',
      taxRate: 0.07,
    },
    description: 'Additional metadata for the payment',
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
