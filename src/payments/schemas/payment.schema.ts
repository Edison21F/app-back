import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Business' })
  businessId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string; // USD, EUR, etc.

  @Prop({ required: true })
  paymentMethod: string; // stripe, cash, bank_transfer

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  receivedBy: MongooseSchema.Types.ObjectId; // if manual payment, the receptionist who received it

  @Prop()
  stripePaymentIntentId: string;

  @Prop({ default: 'pending' }) // pending, completed, failed, refunded
  status: string;

  @Prop()
  description: string;

  @Prop() // Class or appointment or subscription
  referenceType: string;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  referenceId: MongooseSchema.Types.ObjectId;

  @Prop()
  receiptUrl: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Indexes
PaymentSchema.index({ businessId: 1 });
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ stripePaymentIntentId: 1 });
PaymentSchema.index({ referenceType: 1, referenceId: 1 });
PaymentSchema.index({ createdAt: -1 });
