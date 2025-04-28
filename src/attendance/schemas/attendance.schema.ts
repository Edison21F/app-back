import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

@Schema({ timestamps: true })
export class Attendance {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Business' })
  businessId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true }) // class or appointment
  referenceType: string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId })
  referenceId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ default: 'present' }) // present, absent, late, excused
  status: string;

  @Prop()
  notes: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  markedBy: MongooseSchema.Types.ObjectId; // instructor or receptionist who marked attendance

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

// Indexes
AttendanceSchema.index({ businessId: 1 });
AttendanceSchema.index({ userId: 1 });
AttendanceSchema.index({ referenceType: 1, referenceId: 1 });
AttendanceSchema.index({ date: 1 });
AttendanceSchema.index({ status: 1 });
AttendanceSchema.index({ businessId: 1, date: 1 });
