import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { UserRole } from '../../common/decorators/roles.decorator';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.password;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  password: string;

  @Prop({ 
    type: String, 
    enum: Object.values(UserRole),
    default: UserRole.STUDENT 
  })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Business', required: true })
  businessId: MongooseSchema.Types.ObjectId;

  @Prop()
  resetPasswordToken: string;

  @Prop()
  resetPasswordExpires: Date;

  @Prop()
  stripeCustomerId: string;

  // Extended fields for receptionist
  @Prop({ type: Boolean, default: false })
  canAcceptPayments: boolean;

  // Extended fields for instructors/professionals
  @Prop({ type: [String], default: [] })
  specialties: string[];

  @Prop()
  bio: string;

  // For rate limiting and security
  @Prop()
  lastLoginAt: Date;

  @Prop({ default: 0 })
  loginAttempts: number;

  @Prop()
  lockUntil: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ businessId: 1 });
UserSchema.index({ businessId: 1, role: 1 });
