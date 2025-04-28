import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from './schemas/course.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { BusinessesService } from '../businesses/businesses.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    private businessesService: BusinessesService,
    private usersService: UsersService
  ) {}

  async create(createCourseDto: CreateCourseDto): Promise<CourseDocument> {
    // Validate business exists
    await this.businessesService.findById(createCourseDto.businessId.toString());
    
    // Validate instructors exist and belong to this business
    if (createCourseDto.instructors && createCourseDto.instructors.length > 0) {
      for (const instructorId of createCourseDto.instructors) {
        const instructor = await this.usersService.findById(instructorId.toString());
        
        // Check if instructor belongs to the business
        if (instructor.businessId.toString() !== createCourseDto.businessId.toString()) {
          throw new BadRequestException(`Instructor ${instructorId} does not belong to this business`);
        }
        
        // Check if user has instructor or professional role
        if (instructor.role !== 'instructor' && instructor.role !== 'professional') {
          throw new BadRequestException(`User ${instructorId} is not an instructor or professional`);
        }
      }
    }
    
    const newCourse = new this.courseModel(createCourseDto);
    return newCourse.save();
  }

  async findAll(businessId?: string, isActive?: boolean): Promise<CourseDocument[]> {
    let query: any = {};
    
    if (businessId) {
      if (!Types.ObjectId.isValid(businessId)) {
        throw new BadRequestException('Invalid business ID');
      }
      query.businessId = new Types.ObjectId(businessId);
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive;
    }
    
    return this.courseModel.find(query)
      .populate('instructors', 'name email role')
      .sort({ name: 1 })
      .exec();
  }

  async findById(id: string): Promise<CourseDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid course ID');
    }

    const course = await this.courseModel.findById(id)
      .populate('instructors', 'name email role')
      .exec();
    
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    
    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<CourseDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid course ID');
    }

    // Validate instructors if provided
    if (updateCourseDto.instructors && updateCourseDto.instructors.length > 0) {
      // Get current course to get business ID if not provided in update
      const currentCourse = await this.findById(id);
      const businessId = updateCourseDto.businessId || currentCourse.businessId;
      
      for (const instructorId of updateCourseDto.instructors) {
        const instructor = await this.usersService.findById(instructorId.toString());
        
        // Check if instructor belongs to the business
        if (instructor.businessId.toString() !== businessId.toString()) {
          throw new BadRequestException(`Instructor ${instructorId} does not belong to this business`);
        }
        
        // Check if user has instructor or professional role
        if (instructor.role !== 'instructor' && instructor.role !== 'professional') {
          throw new BadRequestException(`User ${instructorId} is not an instructor or professional`);
        }
      }
    }

    const updatedCourse = await this.courseModel.findByIdAndUpdate(
      id,
      { $set: updateCourseDto },
      { new: true },
    ).populate('instructors', 'name email role').exec();
    
    if (!updatedCourse) {
      throw new NotFoundException('Course not found');
    }
    
    return updatedCourse;
  }

  async remove(id: string): Promise<CourseDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid course ID');
    }

    const deletedCourse = await this.courseModel.findByIdAndDelete(id).exec();
    
    if (!deletedCourse) {
      throw new NotFoundException('Course not found');
    }
    
    return deletedCourse;
  }

  async findByInstructor(instructorId: string): Promise<CourseDocument[]> {
    if (!Types.ObjectId.isValid(instructorId)) {
      throw new BadRequestException('Invalid instructor ID');
    }

    return this.courseModel.find({ 
      instructors: new Types.ObjectId(instructorId),
      isActive: true 
    }).exec();
  }

  async activateCourse(id: string): Promise<CourseDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid course ID');
    }

    const activatedCourse = await this.courseModel.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true },
    ).exec();
    
    if (!activatedCourse) {
      throw new NotFoundException('Course not found');
    }
    
    return activatedCourse;
  }

  async deactivateCourse(id: string): Promise<CourseDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid course ID');
    }

    const deactivatedCourse = await this.courseModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    ).exec();
    
    if (!deactivatedCourse) {
      throw new NotFoundException('Course not found');
    }
    
    return deactivatedCourse;
  }

  async addInstructor(id: string, instructorId: string): Promise<CourseDocument> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(instructorId)) {
      throw new BadRequestException('Invalid ID format');
    }

    // Get the course to check business ID
    const course = await this.findById(id);
    
    // Validate instructor
    const instructor = await this.usersService.findById(instructorId);
    
    // Check if instructor belongs to the same business
    if (instructor.businessId.toString() !== course.businessId.toString()) {
      throw new BadRequestException('Instructor does not belong to the same business as the course');
    }
    
    // Check if user has instructor or professional role
    if (instructor.role !== 'instructor' && instructor.role !== 'professional') {
      throw new BadRequestException('User is not an instructor or professional');
    }

    // Add instructor to the course
    const updatedCourse = await this.courseModel.findByIdAndUpdate(
      id,
      { $addToSet: { instructors: new Types.ObjectId(instructorId) } },
      { new: true },
    ).populate('instructors', 'name email role').exec();
    
    if (!updatedCourse) {
      throw new NotFoundException('Course not found');
    }
    
    return updatedCourse;
  }

  async removeInstructor(id: string, instructorId: string): Promise<CourseDocument> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(instructorId)) {
      throw new BadRequestException('Invalid ID format');
    }

    const updatedCourse = await this.courseModel.findByIdAndUpdate(
      id,
      { $pull: { instructors: new Types.ObjectId(instructorId) } },
      { new: true },
    ).populate('instructors', 'name email role').exec();
    
    if (!updatedCourse) {
      throw new NotFoundException('Course not found');
    }
    
    return updatedCourse;
  }
}
