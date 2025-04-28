import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Business, BusinessDocument } from './schemas/business.schema';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  constructor(
    @InjectModel(Business.name) private businessModel: Model<BusinessDocument>,
  ) {}

  async create(createBusinessDto: CreateBusinessDto): Promise<BusinessDocument> {
    const newBusiness = new this.businessModel(createBusinessDto);
    return newBusiness.save();
  }

  async findAll(): Promise<BusinessDocument[]> {
    return this.businessModel.find().exec();
  }

  async findById(id: string): Promise<BusinessDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid business ID');
    }

    const business = await this.businessModel.findById(id).exec();
    
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    
    return business;
  }

  async update(id: string, updateBusinessDto: UpdateBusinessDto): Promise<BusinessDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid business ID');
    }

    const updatedBusiness = await this.businessModel.findByIdAndUpdate(
      id,
      { $set: updateBusinessDto },
      { new: true },
    ).exec();
    
    if (!updatedBusiness) {
      throw new NotFoundException('Business not found');
    }
    
    return updatedBusiness;
  }

  async remove(id: string): Promise<BusinessDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid business ID');
    }

    const deletedBusiness = await this.businessModel.findByIdAndDelete(id).exec();
    
    if (!deletedBusiness) {
      throw new NotFoundException('Business not found');
    }
    
    return deletedBusiness;
  }

  async addAdministrator(id: string, userId: string): Promise<BusinessDocument> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid ID format');
    }

    const business = await this.businessModel.findByIdAndUpdate(
      id,
      { $addToSet: { administrators: new Types.ObjectId(userId) } },
      { new: true },
    ).exec();
    
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    
    return business;
  }

  async removeAdministrator(id: string, userId: string): Promise<BusinessDocument> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid ID format');
    }

    const business = await this.businessModel.findByIdAndUpdate(
      id,
      { $pull: { administrators: new Types.ObjectId(userId) } },
      { new: true },
    ).exec();
    
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    
    return business;
  }

  async activateBusiness(id: string): Promise<BusinessDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid business ID');
    }

    const business = await this.businessModel.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true },
    ).exec();
    
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    
    return business;
  }

  async deactivateBusiness(id: string): Promise<BusinessDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid business ID');
    }

    const business = await this.businessModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    ).exec();
    
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    
    return business;
  }

  async updateStripeSettings(id: string, stripeAccountId: string, stripeEnabled: boolean): Promise<BusinessDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid business ID');
    }

    const business = await this.businessModel.findByIdAndUpdate(
      id,
      { 
        stripeAccountId,
        stripeEnabled,
      },
      { new: true },
    ).exec();
    
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    
    return business;
  }
}
