import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AppointmentDocument = Appointment & Document;

@Schema({ timestamps: true })
export class Appointment {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Course' })
  courseId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Business' })
  businessId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  professionalId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  clientId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop()
  location: string;

  @Prop()
  notes: string;

  @Prop({ default: 'scheduled' }) // scheduled, confirmed, in-progress, completed, cancelled, no-show
  status: string;

  @Prop({ default: 0 })
  price: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Payment' })
  paymentId: MongooseSchema.Types.ObjectId;

  @Prop({ default: false })
  isPaid: boolean;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

// Indexes
AppointmentSchema.index({ businessId: 1 });
AppointmentSchema.index({ professionalId: 1 });
AppointmentSchema.index({ clientId: 1 });
AppointmentSchema.index({ startDate: 1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ businessId: 1, startDate: 1 });
AppointmentSchema.index({ isPaid: 1 });
