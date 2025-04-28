import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ClassDocument = Class & Document;

@Schema({ timestamps: true })
export class Class {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Course' })
  courseId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Business' })
  businessId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  instructorId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop()
  location: string;

  @Prop()
  notes: string;

  @Prop({ default: 0 })
  currentCapacity: number;

  @Prop({ default: 0 })
  maxCapacity: number;

  @Prop({ default: 'scheduled' }) // scheduled, in-progress, completed, cancelled
  status: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  enrolledStudents: MongooseSchema.Types.ObjectId[];

  @Prop({ default: 0 })
  price: number;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const ClassSchema = SchemaFactory.createForClass(Class);

// Indexes
ClassSchema.index({ businessId: 1 });
ClassSchema.index({ courseId: 1 });
ClassSchema.index({ instructorId: 1 });
ClassSchema.index({ startDate: 1 });
ClassSchema.index({ status: 1 });
ClassSchema.index({ businessId: 1, startDate: 1 });
