import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Class, ClassDocument } from './schemas/class.schema';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { CoursesService } from '../courses/courses.service';
import { UsersService } from '../users/users.service';
import { BusinessesService } from '../businesses/businesses.service';

@Injectable()
export class ClassesService {
  constructor(
    @InjectModel(Class.name) private classModel: Model<ClassDocument>,
    private coursesService: CoursesService,
    private usersService: UsersService,
    private businessesService: BusinessesService
  ) {}

  async create(createClassDto: CreateClassDto): Promise<ClassDocument> {
    // Validate course exists
    const course = await this.coursesService.findById(createClassDto.courseId.toString());
    
    // Check businessId consistency
    if (course.businessId.toString() !== createClassDto.businessId.toString()) {
      throw new BadRequestException('Business ID mismatch between course and class');
    }
    
    // Validate instructor exists and is part of the course instructors
    const instructor = await this.usersService.findById(createClassDto.instructorId.toString());
    
    // Check if instructor belongs to the business
    if (instructor.businessId.toString() !== createClassDto.businessId.toString()) {
      throw new BadRequestException('Instructor does not belong to this business');
    }
    
    // Check if instructor is assigned to this course
    const isInstructorAssigned = course.instructors.some(
      id => id.toString() === createClassDto.instructorId.toString()
    );
    
    if (!isInstructorAssigned) {
      throw new BadRequestException('Instructor is not assigned to this course');
    }
    
    // Verify dates
    const startDate = new Date(createClassDto.startDate);
    const endDate = new Date(createClassDto.endDate);
    
    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }
    
    // Set default max capacity from course if not provided
    if (!createClassDto.maxCapacity) {
      createClassDto.maxCapacity = course.maxCapacity;
    }
    
    // Set default price from course if not provided
    if (!createClassDto.price) {
      createClassDto.price = course.basePrice;
    }
    
    const newClass = new this.classModel(createClassDto);
    return newClass.save();
  }

  async findAll(
    businessId?: string,
    instructorId?: string, 
    courseId?: string,
    startDate?: Date,
    endDate?: Date,
    status?: string
  ): Promise<ClassDocument[]> {
    let query: any = {};
    
    if (businessId) {
      if (!Types.ObjectId.isValid(businessId)) {
        throw new BadRequestException('Invalid business ID');
      }
      query.businessId = new Types.ObjectId(businessId);
    }
    
    if (instructorId) {
      if (!Types.ObjectId.isValid(instructorId)) {
        throw new BadRequestException('Invalid instructor ID');
      }
      query.instructorId = new Types.ObjectId(instructorId);
    }
    
    if (courseId) {
      if (!Types.ObjectId.isValid(courseId)) {
        throw new BadRequestException('Invalid course ID');
      }
      query.courseId = new Types.ObjectId(courseId);
    }
    
    if (startDate && endDate) {
      query.startDate = { $gte: startDate };
      query.endDate = { $lte: endDate };
    } else if (startDate) {
      query.startDate = { $gte: startDate };
    } else if (endDate) {
      query.endDate = { $lte: endDate };
    }
    
    if (status) {
      query.status = status;
    }
    
    return this.classModel.find(query)
      .populate('courseId', 'name type')
      .populate('instructorId', 'name email')
      .populate('enrolledStudents', 'name email')
      .sort({ startDate: 1 })
      .exec();
  }

  async findById(id: string): Promise<ClassDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid class ID');
    }

    const classObj = await this.classModel.findById(id)
      .populate('courseId', 'name type description maxCapacity basePrice')
      .populate('instructorId', 'name email')
      .populate('enrolledStudents', 'name email')
      .exec();
    
    if (!classObj) {
      throw new NotFoundException('Class not found');
    }
    
    return classObj;
  }

  async update(id: string, updateClassDto: UpdateClassDto): Promise<ClassDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid class ID');
    }

    // Get existing class
    const existingClass = await this.findById(id);
    
    // Verify date changes if provided
    if (updateClassDto.startDate || updateClassDto.endDate) {
      const startDate = updateClassDto.startDate 
        ? new Date(updateClassDto.startDate) 
        : existingClass.startDate;
      
      const endDate = updateClassDto.endDate 
        ? new Date(updateClassDto.endDate) 
        : existingClass.endDate;
      
      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }
    
    // Verify instructor if changing
    if (updateClassDto.instructorId) {
      // Check if instructor exists
      const instructor = await this.usersService.findById(updateClassDto.instructorId.toString());
      
      // Check if instructor belongs to this business
      if (instructor.businessId.toString() !== existingClass.businessId.toString()) {
        throw new BadRequestException('Instructor does not belong to this business');
      }
      
      // Check if instructor is assigned to this course
      const course = await this.coursesService.findById(existingClass.courseId.toString());
      
      const isInstructorAssigned = course.instructors.some(
        id => id.toString() === updateClassDto.instructorId.toString()
      );
      
      if (!isInstructorAssigned) {
        throw new BadRequestException('Instructor is not assigned to this course');
      }
    }
    
    // Validate max capacity if changing
    if (updateClassDto.maxCapacity && updateClassDto.maxCapacity < existingClass.currentCapacity) {
      throw new BadRequestException('New max capacity cannot be less than current enrollment');
    }

    const updatedClass = await this.classModel.findByIdAndUpdate(
      id,
      { $set: updateClassDto },
      { new: true },
    )
      .populate('courseId', 'name type')
      .populate('instructorId', 'name email')
      .populate('enrolledStudents', 'name email')
      .exec();
    
    if (!updatedClass) {
      throw new NotFoundException('Class not found');
    }
    
    return updatedClass;
  }

  async remove(id: string): Promise<ClassDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid class ID');
    }

    // Check if class has enrolled students before deleting
    const classToDelete = await this.findById(id);
    
    if (classToDelete.enrolledStudents.length > 0) {
      throw new BadRequestException('Cannot delete class with enrolled students');
    }

    const deletedClass = await this.classModel.findByIdAndDelete(id).exec();
    
    if (!deletedClass) {
      throw new NotFoundException('Class not found');
    }
    
    return deletedClass;
  }

  async enrollStudent(id: string, studentId: string): Promise<ClassDocument> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Invalid ID format');
    }

    // Get the class
    const classObj = await this.findById(id);
    
    // Check if class is full
    if (classObj.currentCapacity >= classObj.maxCapacity) {
      throw new BadRequestException('Class is already at maximum capacity');
    }
    
    // Check if student exists and belongs to the same business
    const student = await this.usersService.findById(studentId);
    
    if (student.businessId.toString() !== classObj.businessId.toString()) {
      throw new BadRequestException('Student does not belong to this business');
    }
    
    // Check if student is already enrolled
    const isAlreadyEnrolled = classObj.enrolledStudents.some(
      id => id.toString() === studentId
    );
    
    if (isAlreadyEnrolled) {
      throw new BadRequestException('Student is already enrolled in this class');
    }
    
    // Enroll student and increment current capacity
    const updatedClass = await this.classModel.findByIdAndUpdate(
      id,
      { 
        $addToSet: { enrolledStudents: new Types.ObjectId(studentId) },
        $inc: { currentCapacity: 1 }
      },
      { new: true },
    )
      .populate('courseId', 'name type')
      .populate('instructorId', 'name email')
      .populate('enrolledStudents', 'name email')
      .exec();
    
    if (!updatedClass) {
      throw new NotFoundException('Class not found');
    }
    
    return updatedClass;
  }

  async removeStudent(id: string, studentId: string): Promise<ClassDocument> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Invalid ID format');
    }

    // Get the class
    const classObj = await this.findById(id);
    
    // Check if student is enrolled
    const isEnrolled = classObj.enrolledStudents.some(
      id => id.toString() === studentId
    );
    
    if (!isEnrolled) {
      throw new BadRequestException('Student is not enrolled in this class');
    }
    
    // Remove student and decrement current capacity
    const updatedClass = await this.classModel.findByIdAndUpdate(
      id,
      { 
        $pull: { enrolledStudents: new Types.ObjectId(studentId) },
        $inc: { currentCapacity: -1 }
      },
      { new: true },
    )
      .populate('courseId', 'name type')
      .populate('instructorId', 'name email')
      .populate('enrolledStudents', 'name email')
      .exec();
    
    if (!updatedClass) {
      throw new NotFoundException('Class not found');
    }
    
    return updatedClass;
  }

  async updateStatus(id: string, status: string): Promise<ClassDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid class ID');
    }

    // Validate status
    const validStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updatedClass = await this.classModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    )
      .populate('courseId', 'name type')
      .populate('instructorId', 'name email')
      .populate('enrolledStudents', 'name email')
      .exec();
    
    if (!updatedClass) {
      throw new NotFoundException('Class not found');
    }
    
    return updatedClass;
  }

  async findUpcomingClasses(businessId: string, days: number = 7): Promise<ClassDocument[]> {
    if (!Types.ObjectId.isValid(businessId)) {
      throw new BadRequestException('Invalid business ID');
    }

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    return this.classModel.find({
      businessId: new Types.ObjectId(businessId),
      startDate: { $gte: today, $lte: futureDate },
      status: 'scheduled'
    })
      .populate('courseId', 'name type')
      .populate('instructorId', 'name email')
      .sort({ startDate: 1 })
      .exec();
  }

  async findStudentClasses(studentId: string): Promise<ClassDocument[]> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    return this.classModel.find({
      enrolledStudents: new Types.ObjectId(studentId)
    })
      .populate('courseId', 'name type')
      .populate('instructorId', 'name email')
      .sort({ startDate: 1 })
      .exec();
  }

  async findInstructorClasses(instructorId: string, startDate?: Date, endDate?: Date): Promise<ClassDocument[]> {
    if (!Types.ObjectId.isValid(instructorId)) {
      throw new BadRequestException('Invalid instructor ID');
    }

    let query: any = {
      instructorId: new Types.ObjectId(instructorId)
    };
    
    if (startDate && endDate) {
      query.startDate = { $gte: startDate };
      query.endDate = { $lte: endDate };
    } else if (startDate) {
      query.startDate = { $gte: startDate };
    } else if (endDate) {
      query.endDate = { $lte: endDate };
    }
    
    return this.classModel.find(query)
      .populate('courseId', 'name type')
      .populate('enrolledStudents', 'name email')
      .sort({ startDate: 1 })
      .exec();
  }
}
