import { Schema, model, Document } from 'mongoose';

// 1. Interfaz para tu documento
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Schema de Mongoose
const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

// 3. Modelo de Mongoose
export const UserModel = model<IUser>('User', UserSchema);
