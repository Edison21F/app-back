import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CourseDocument = Course & Document;

@Schema({ timestamps: true })
export class Course {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  type: string; // class, appointment, consultation

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Business' })
  businessId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, min: 0 })
  basePrice: number;

  @Prop({ required: true, min: 0 })
  durationMinutes: number;

  @Prop({ required: true, min: 0 })
  maxCapacity: number;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }] })
  instructors: MongooseSchema.Types.ObjectId[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: [] })
  tags: string[];

  @Prop()
  imageUrl: string;

  @Prop({ type: Object, default: {} })
  requirements: Record<string, any>;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const CourseSchema = SchemaFactory.createForClass(Course);

// Indexes
CourseSchema.index({ businessId: 1 });
CourseSchema.index({ businessId: 1, isActive: 1 });
CourseSchema.index({ businessId: 1, type: 1 });
CourseSchema.index({ 'instructors': 1 });
