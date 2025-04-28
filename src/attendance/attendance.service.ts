import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance, AttendanceDocument } from './schemas/attendance.schema';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UsersService } from '../users/users.service';
import { ClassesService } from '../classes/classes.service';
import { AppointmentsService } from '../appointments/appointments.service';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<AttendanceDocument>,
    private usersService: UsersService,
    private classesService: ClassesService,
    private appointmentsService: AppointmentsService,
  ) {}

  async create(createAttendanceDto: CreateAttendanceDto): Promise<AttendanceDocument> {
    // Validate user exists
    await this.usersService.findById(createAttendanceDto.userId.toString());
    
    // Validate that the person marking attendance exists
    if (createAttendanceDto.markedBy) {
      const marker = await this.usersService.findById(createAttendanceDto.markedBy.toString());
      
      // Check if marker has appropriate role
      if (marker.role !== 'instructor' && marker.role !== 'professional' && marker.role !== 'receptionist' && marker.role !== 'admin') {
        throw new BadRequestException('Only instructors, professionals, receptionists, or admins can mark attendance');
      }
    }
    
    // Validate reference exists (class or appointment)
    if (createAttendanceDto.referenceType === 'class') {
      const classObj = await this.classesService.findById(createAttendanceDto.referenceId.toString());
      
      // Check if user is enrolled in this class
      const isEnrolled = classObj.enrolledStudents.some(
        id => id.toString() === createAttendanceDto.userId.toString()
      );
      
      if (!isEnrolled) {
        throw new BadRequestException('User is not enrolled in this class');
      }
      
      // Set businessId from the class
      createAttendanceDto.businessId = classObj.businessId;
      
    } else if (createAttendanceDto.referenceType === 'appointment') {
      const appointment = await this.appointmentsService.findById(createAttendanceDto.referenceId.toString());
      
      // Check if user is the client for this appointment
      if (appointment.clientId.toString() !== createAttendanceDto.userId.toString()) {
        throw new BadRequestException('User is not the client for this appointment');
      }
      
      // Set businessId from the appointment
      createAttendanceDto.businessId = appointment.businessId;
      
    } else {
      throw new BadRequestException('Invalid reference type. Must be "class" or "appointment"');
    }
    
    // Check if attendance record already exists
    const existingRecord = await this.attendanceModel.findOne({
      userId: createAttendanceDto.userId,
      referenceType: createAttendanceDto.referenceType,
      referenceId: createAttendanceDto.referenceId,
    }).exec();
    
    if (existingRecord) {
      throw new BadRequestException('Attendance record already exists for this user and reference');
    }
    
    const newAttendance = new this.attendanceModel(createAttendanceDto);
    return newAttendance.save();
  }

  async findAll(
    businessId?: string,
    userId?: string,
    referenceType?: string,
    referenceId?: string,
    startDate?: Date,
    endDate?: Date,
    status?: string
  ): Promise<AttendanceDocument[]> {
    let query: any = {};
    
    if (businessId) {
      if (!Types.ObjectId.isValid(businessId)) {
        throw new BadRequestException('Invalid business ID');
      }
      query.businessId = new Types.ObjectId(businessId);
    }
    
    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      query.userId = new Types.ObjectId(userId);
    }
    
    if (referenceType) {
      query.referenceType = referenceType;
    }
    
    if (referenceId) {
      if (!Types.ObjectId.isValid(referenceId)) {
        throw new BadRequestException('Invalid reference ID');
      }
      query.referenceId = new Types.ObjectId(referenceId);
    }
    
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }
    
    if (status) {
      query.status = status;
    }
    
    return this.attendanceModel.find(query)
      .populate('userId', 'name email')
      .populate('markedBy', 'name email')
      .sort({ date: -1 })
      .exec();
  }

  async findById(id: string): Promise<AttendanceDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid attendance ID');
    }

    const attendance = await this.attendanceModel.findById(id)
      .populate('userId', 'name email')
      .populate('markedBy', 'name email')
      .exec();
    
    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }
    
    return attendance;
  }

  async update(id: string, updateAttendanceDto: any): Promise<AttendanceDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid attendance ID');
    }

    // Get the existing record
    const existingRecord = await this.findById(id);
    
    // Verify markedBy if changing
    if (updateAttendanceDto.markedBy) {
      const marker = await this.usersService.findById(updateAttendanceDto.markedBy.toString());
      
      // Check if marker has appropriate role
      if (marker.role !== 'instructor' && marker.role !== 'professional' && marker.role !== 'receptionist' && marker.role !== 'admin') {
        throw new BadRequestException('Only instructors, professionals, receptionists, or admins can mark attendance');
      }
    }

    const updatedAttendance = await this.attendanceModel.findByIdAndUpdate(
      id,
      { $set: updateAttendanceDto },
      { new: true },
    )
      .populate('userId', 'name email')
      .populate('markedBy', 'name email')
      .exec();
    
    if (!updatedAttendance) {
      throw new NotFoundException('Attendance record not found');
    }
    
    return updatedAttendance;
  }

  async remove(id: string): Promise<AttendanceDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid attendance ID');
    }

    const deletedAttendance = await this.attendanceModel.findByIdAndDelete(id).exec();
    
    if (!deletedAttendance) {
      throw new NotFoundException('Attendance record not found');
    }
    
    return deletedAttendance;
  }

  async getUserAttendanceStats(userId: string, businessId: string, startDate?: Date, endDate?: Date): Promise<any> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(businessId)) {
      throw new BadRequestException('Invalid ID format');
    }

    // Set default date range if not provided
    const end = endDate || new Date();
    const start = startDate || new Date(end.getFullYear(), end.getMonth() - 3, 1); // Default 3 months back
    
    // Get all attendance records for this user
    const attendanceRecords = await this.attendanceModel.find({
      userId: new Types.ObjectId(userId),
      businessId: new Types.ObjectId(businessId),
      date: { $gte: start, $lte: end }
    }).exec();
    
    // Count by status
    const statusCounts = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      total: attendanceRecords.length
    };
    
    attendanceRecords.forEach(record => {
      statusCounts[record.status]++;
    });
    
    // Calculate attendance rate
    const attendanceRate = statusCounts.total > 0
      ? ((statusCounts.present + statusCounts.late) / statusCounts.total) * 100
      : 0;
    
    return {
      userId,
      counts: statusCounts,
      attendanceRate: Math.round(attendanceRate * 10) / 10, // Round to 1 decimal place
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      }
    };
  }

  async getClassAttendanceStats(classId: string): Promise<any> {
    if (!Types.ObjectId.isValid(classId)) {
      throw new BadRequestException('Invalid class ID');
    }

    // Get the class to find enrolled students
    const classObj = await this.classesService.findById(classId);
    
    // Get all attendance records for this class
    const attendanceRecords = await this.attendanceModel.find({
      referenceType: 'class',
      referenceId: new Types.ObjectId(classId)
    }).exec();
    
    // Calculate attendance statistics
    const totalEnrolled = classObj.enrolledStudents.length;
    const totalAttendanceRecords = attendanceRecords.length;
    
    // Count by status
    const statusCounts = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0
    };
    
    attendanceRecords.forEach(record => {
      statusCounts[record.status]++;
    });
    
    // Calculate percentage of students with attendance records
    const attendanceRate = totalEnrolled > 0
      ? (totalAttendanceRecords / totalEnrolled) * 100
      : 0;
    
    // Calculate percentage of present/late students
    const presentRate = totalAttendanceRecords > 0
      ? ((statusCounts.present + statusCounts.late) / totalAttendanceRecords) * 100
      : 0;
    
    return {
      classId,
      className: classObj.courseId['name'],
      totalEnrolled,
      totalAttendanceRecords,
      statusCounts,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      presentRate: Math.round(presentRate * 10) / 10
    };
  }

  async bulkMarkAttendance(
    referenceType: string,
    referenceId: string,
    userStatusList: { userId: string, status: string }[],
    markedBy: string
  ): Promise<AttendanceDocument[]> {
    if (!Types.ObjectId.isValid(referenceId) || !Types.ObjectId.isValid(markedBy)) {
      throw new BadRequestException('Invalid ID format');
    }

    // Validate reference
    let businessId;
    
    if (referenceType === 'class') {
      const classObj = await this.classesService.findById(referenceId);
      businessId = classObj.businessId;
      
      // Validate all users are enrolled in this class
      for (const item of userStatusList) {
        const isEnrolled = classObj.enrolledStudents.some(
          id => id.toString() === item.userId
        );
        
        if (!isEnrolled) {
          throw new BadRequestException(`User ${item.userId} is not enrolled in this class`);
        }
      }
      
    } else if (referenceType === 'appointment') {
      throw new BadRequestException('Bulk marking is not applicable for appointments');
    } else {
      throw new BadRequestException('Invalid reference type. Must be "class" or "appointment"');
    }
    
    // Validate marker
    const marker = await this.usersService.findById(markedBy);
    
    // Check if marker has appropriate role
    if (marker.role !== 'instructor' && marker.role !== 'professional' && marker.role !== 'receptionist' && marker.role !== 'admin') {
      throw new BadRequestException('Only instructors, professionals, receptionists, or admins can mark attendance');
    }
    
    // Check for existing records
    const existingRecords = await this.attendanceModel.find({
      referenceType,
      referenceId: new Types.ObjectId(referenceId),
    }).exec();
    
    // Create a map of existing records by userId
    const existingByUserId = {};
    existingRecords.forEach(record => {
      existingByUserId[record.userId.toString()] = record;
    });
    
    // Process each user status
    const results = [];
    const today = new Date();
    
    for (const item of userStatusList) {
      const userId = item.userId;
      const status = item.status;
      
      // Validate status
      if (!['present', 'absent', 'late', 'excused'].includes(status)) {
        throw new BadRequestException(`Invalid status "${status}" for user ${userId}`);
      }
      
      if (existingByUserId[userId]) {
        // Update existing record
        const updated = await this.update(existingByUserId[userId]._id, {
          status,
          markedBy: new Types.ObjectId(markedBy),
          date: today
        });
        results.push(updated);
      } else {
        // Create new record
        const created = await this.create({
          userId: new Types.ObjectId(userId),
          referenceType,
          referenceId: new Types.ObjectId(referenceId),
          businessId: new Types.ObjectId(businessId),
          date: today,
          status,
          markedBy: new Types.ObjectId(markedBy)
        });
        results.push(created);
      }
    }
    
    return results;
  }
}
