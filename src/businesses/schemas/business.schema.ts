import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type BusinessDocument = Business & Document;

@Schema({ timestamps: true })
export class Business {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string; // academy, gym, clinic, etc.

  @Prop()
  description: string;

  @Prop({ required: true })
  address: string;

  @Prop()
  city: string;

  @Prop()
  state: string;

  @Prop()
  zipCode: string;

  @Prop()
  country: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  website: string;

  @Prop()
  logoUrl: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: {} })
  businessHours: Record<string, { open: string; close: string }>;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  administrators: MongooseSchema.Types.ObjectId[];

  // Payment settings
  @Prop({ default: false })
  stripeEnabled: boolean;

  @Prop()
  stripeAccountId: string;

  @Prop({ default: false })
  manualPaymentsEnabled: boolean;

  // Subscription and billing
  @Prop()
  subscriptionPlan: string;

  @Prop()
  subscriptionStatus: string;

  @Prop()
  subscriptionExpiresAt: Date;

  // Custom settings
  @Prop({ type: Object, default: {} })
  settings: Record<string, any>;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);

// Indexes
BusinessSchema.index({ name: 1 });
BusinessSchema.index({ isActive: 1 });
