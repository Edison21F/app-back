import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    // Check if email is already in use
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      throw new BadRequestException('Email is already in use');
    }

    // Hash password if provided
    if (createUserDto.password) {
      createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
    }

    const newUser = new this.userModel(createUserDto);
    return newUser.save();
  }

  async findAll(businessId?: string, role?: string): Promise<UserDocument[]> {
    let query: any = {};
    
    if (businessId) {
      query.businessId = new Types.ObjectId(businessId);
    }
    
    if (role) {
      query.role = role;
    }
    
    return this.userModel.find(query).exec();
  }

  async findById(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(id).exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByResetToken(token: string): Promise<UserDocument> {
    return this.userModel.findOne({ 
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    // If password is being updated, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      { $set: updateUserDto },
      { new: true },
    ).exec();
    
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    
    return updatedUser;
  }

  async remove(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();
    
    if (!deletedUser) {
      throw new NotFoundException('User not found');
    }
    
    return deletedUser;
  }

  async updateResetToken(id: string, token: string, expires: Date): Promise<UserDocument> {
    return this.userModel.findByIdAndUpdate(
      id,
      {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      },
      { new: true },
    ).exec();
  }

  async resetPassword(id: string, hashedPassword: string): Promise<UserDocument> {
    return this.userModel.findByIdAndUpdate(
      id,
      {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
      { new: true },
    ).exec();
  }

  async incrementLoginAttempts(id: string): Promise<UserDocument> {
    return this.userModel.findByIdAndUpdate(
      id,
      { $inc: { loginAttempts: 1 } },
      { new: true },
    ).exec();
  }

  async resetLoginAttempts(id: string): Promise<UserDocument> {
    return this.userModel.findByIdAndUpdate(
      id,
      { loginAttempts: 0 },
      { new: true },
    ).exec();
  }

  async updateLastLogin(id: string): Promise<UserDocument> {
    return this.userModel.findByIdAndUpdate(
      id,
      { lastLoginAt: new Date() },
      { new: true },
    ).exec();
  }

  async updateStripeCustomerId(id: string, stripeCustomerId: string): Promise<UserDocument> {
    return this.userModel.findByIdAndUpdate(
      id,
      { stripeCustomerId },
      { new: true },
    ).exec();
  }

  async findByBusinessId(businessId: string): Promise<UserDocument[]> {
    if (!Types.ObjectId.isValid(businessId)) {
      throw new BadRequestException('Invalid business ID');
    }

    return this.userModel.find({ businessId: new Types.ObjectId(businessId) }).exec();
  }

  async countByBusinessId(businessId: string): Promise<number> {
    if (!Types.ObjectId.isValid(businessId)) {
      throw new BadRequestException('Invalid business ID');
    }

    return this.userModel.countDocuments({ businessId: new Types.ObjectId(businessId) }).exec();
  }

  async activateUser(id: string): Promise<UserDocument> {
    return this.userModel.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true },
    ).exec();
  }

  async deactivateUser(id: string): Promise<UserDocument> {
    return this.userModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    ).exec();
  }
}
