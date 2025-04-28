import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CoursesService } from '../courses/courses.service';
import { UsersService } from '../users/users.service';
import { BusinessesService } from '../businesses/businesses.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    private coursesService: CoursesService,
    private usersService: UsersService,
    private businessesService: BusinessesService
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<AppointmentDocument> {
    // Validate course exists
    const course = await this.coursesService.findById(createAppointmentDto.courseId.toString());
    
    // Check businessId consistency
    if (course.businessId.toString() !== createAppointmentDto.businessId.toString()) {
      throw new BadRequestException('Business ID mismatch between course and appointment');
    }
    
    // Validate professional exists and is part of the course instructors
    const professional = await this.usersService.findById(createAppointmentDto.professionalId.toString());
    
    // Check if professional belongs to the business
    if (professional.businessId.toString() !== createAppointmentDto.businessId.toString()) {
      throw new BadRequestException('Professional does not belong to this business');
    }
    
    // Check if professional has correct role
    if (professional.role !== 'professional' && professional.role !== 'instructor') {
      throw new BadRequestException('User is not a professional or instructor');
    }
    
    // Check if professional is assigned to this course
    const isProfessionalAssigned = course.instructors.some(
      id => id.toString() === createAppointmentDto.professionalId.toString()
    );
    
    if (!isProfessionalAssigned) {
      throw new BadRequestException('Professional is not assigned to this course');
    }
    
    // Validate client exists and belongs to the business
    const client = await this.usersService.findById(createAppointmentDto.clientId.toString());
    
    if (client.businessId.toString() !== createAppointmentDto.businessId.toString()) {
      throw new BadRequestException('Client does not belong to this business');
    }
    
    // Verify dates
    const startDate = new Date(createAppointmentDto.startDate);
    const endDate = new Date(createAppointmentDto.endDate);
    
    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }
    
    // Check for time slot conflicts
    const overlappingAppointment = await this.appointmentModel.findOne({
      professionalId: createAppointmentDto.professionalId,
      $or: [
        {
          startDate: { $lt: endDate },
          endDate: { $gt: startDate }
        }
      ],
      status: { $nin: ['cancelled', 'no-show'] }
    }).exec();
    
    if (overlappingAppointment) {
      throw new BadRequestException('Professional already has an appointment during this time slot');
    }
    
    // Set default price from course if not provided
    if (!createAppointmentDto.price) {
      createAppointmentDto.price = course.basePrice;
    }
    
    const newAppointment = new this.appointmentModel(createAppointmentDto);
    return newAppointment.save();
  }

  async findAll(
    businessId?: string,
    professionalId?: string,
    clientId?: string,
    startDate?: Date,
    endDate?: Date,
    status?: string,
    isPaid?: boolean
  ): Promise<AppointmentDocument[]> {
    let query: any = {};
    
    if (businessId) {
      if (!Types.ObjectId.isValid(businessId)) {
        throw new BadRequestException('Invalid business ID');
      }
      query.businessId = new Types.ObjectId(businessId);
    }
    
    if (professionalId) {
      if (!Types.ObjectId.isValid(professionalId)) {
        throw new BadRequestException('Invalid professional ID');
      }
      query.professionalId = new Types.ObjectId(professionalId);
    }
    
    if (clientId) {
      if (!Types.ObjectId.isValid(clientId)) {
        throw new BadRequestException('Invalid client ID');
      }
      query.clientId = new Types.ObjectId(clientId);
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
    
    if (isPaid !== undefined) {
      query.isPaid = isPaid;
    }
    
    return this.appointmentModel.find(query)
      .populate('courseId', 'name type')
      .populate('professionalId', 'name email')
      .populate('clientId', 'name email')
      .populate('paymentId')
      .sort({ startDate: 1 })
      .exec();
  }

  async findById(id: string): Promise<AppointmentDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid appointment ID');
    }

    const appointment = await this.appointmentModel.findById(id)
      .populate('courseId', 'name type description basePrice')
      .populate('professionalId', 'name email')
      .populate('clientId', 'name email')
      .populate('paymentId')
      .exec();
    
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    
    return appointment;
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<AppointmentDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid appointment ID');
    }

    // Get existing appointment
    const existingAppointment = await this.findById(id);
    
    // Verify date changes if provided
    if (updateAppointmentDto.startDate || updateAppointmentDto.endDate) {
      const startDate = updateAppointmentDto.startDate 
        ? new Date(updateAppointmentDto.startDate) 
        : existingAppointment.startDate;
      
      const endDate = updateAppointmentDto.endDate 
        ? new Date(updateAppointmentDto.endDate) 
        : existingAppointment.endDate;
      
      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
      
      // Check for time slot conflicts if date is changing
      if (updateAppointmentDto.startDate || updateAppointmentDto.endDate || updateAppointmentDto.professionalId) {
        const professionalId = updateAppointmentDto.professionalId || existingAppointment.professionalId;
        
        const overlappingAppointment = await this.appointmentModel.findOne({
          _id: { $ne: new Types.ObjectId(id) }, // Exclude current appointment
          professionalId,
          $or: [
            {
              startDate: { $lt: endDate },
              endDate: { $gt: startDate }
            }
          ],
          status: { $nin: ['cancelled', 'no-show'] }
        }).exec();
        
        if (overlappingAppointment) {
          throw new BadRequestException('Professional already has an appointment during this time slot');
        }
      }
    }
    
    // Verify professional if changing
    if (updateAppointmentDto.professionalId) {
      // Check if professional exists
      const professional = await this.usersService.findById(updateAppointmentDto.professionalId.toString());
      
      // Check if professional belongs to this business
      if (professional.businessId.toString() !== existingAppointment.businessId.toString()) {
        throw new BadRequestException('Professional does not belong to this business');
      }
      
      // Check if professional has correct role
      if (professional.role !== 'professional' && professional.role !== 'instructor') {
        throw new BadRequestException('User is not a professional or instructor');
      }
      
      // Check if professional is assigned to this course
      const course = await this.coursesService.findById(existingAppointment.courseId.toString());
      
      const isProfessionalAssigned = course.instructors.some(
        id => id.toString() === updateAppointmentDto.professionalId.toString()
      );
      
      if (!isProfessionalAssigned) {
        throw new BadRequestException('Professional is not assigned to this course');
      }
    }
    
    // Verify client if changing
    if (updateAppointmentDto.clientId) {
      // Check if client exists
      const client = await this.usersService.findById(updateAppointmentDto.clientId.toString());
      
      // Check if client belongs to this business
      if (client.businessId.toString() !== existingAppointment.businessId.toString()) {
        throw new BadRequestException('Client does not belong to this business');
      }
    }

    const updatedAppointment = await this.appointmentModel.findByIdAndUpdate(
      id,
      { $set: updateAppointmentDto },
      { new: true },
    )
      .populate('courseId', 'name type')
      .populate('professionalId', 'name email')
      .populate('clientId', 'name email')
      .populate('paymentId')
      .exec();
    
    if (!updatedAppointment) {
      throw new NotFoundException('Appointment not found');
    }
    
    return updatedAppointment;
  }

  async remove(id: string): Promise<AppointmentDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid appointment ID');
    }

    // Check if appointment is already paid before deleting
    const appointmentToDelete = await this.findById(id);
    
    if (appointmentToDelete.isPaid) {
      throw new BadRequestException('Cannot delete a paid appointment. Cancel it instead.');
    }

    const deletedAppointment = await this.appointmentModel.findByIdAndDelete(id).exec();
    
    if (!deletedAppointment) {
      throw new NotFoundException('Appointment not found');
    }
    
    return deletedAppointment;
  }

  async updateStatus(id: string, status: string): Promise<AppointmentDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid appointment ID');
    }

    // Validate status
    const validStatuses = ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'];
    
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updatedAppointment = await this.appointmentModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    )
      .populate('courseId', 'name type')
      .populate('professionalId', 'name email')
      .populate('clientId', 'name email')
      .populate('paymentId')
      .exec();
    
    if (!updatedAppointment) {
      throw new NotFoundException('Appointment not found');
    }
    
    return updatedAppointment;
  }

  async updatePaymentInfo(id: string, paymentId: string, isPaid: boolean): Promise<AppointmentDocument> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(paymentId)) {
      throw new BadRequestException('Invalid ID format');
    }

    const updatedAppointment = await this.appointmentModel.findByIdAndUpdate(
      id,
      { 
        paymentId: new Types.ObjectId(paymentId),
        isPaid,
      },
      { new: true },
    )
      .populate('courseId', 'name type')
      .populate('professionalId', 'name email')
      .populate('clientId', 'name email')
      .populate('paymentId')
      .exec();
    
    if (!updatedAppointment) {
      throw new NotFoundException('Appointment not found');
    }
    
    return updatedAppointment;
  }

  async findUpcomingAppointments(professionalId: string, days: number = 7): Promise<AppointmentDocument[]> {
    if (!Types.ObjectId.isValid(professionalId)) {
      throw new BadRequestException('Invalid professional ID');
    }

    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    return this.appointmentModel.find({
      professionalId: new Types.ObjectId(professionalId),
      startDate: { $gte: today, $lte: futureDate },
      status: { $in: ['scheduled', 'confirmed'] }
    })
      .populate('courseId', 'name type')
      .populate('clientId', 'name email')
      .sort({ startDate: 1 })
      .exec();
  }

  async findClientAppointments(clientId: string): Promise<AppointmentDocument[]> {
    if (!Types.ObjectId.isValid(clientId)) {
      throw new BadRequestException('Invalid client ID');
    }

    return this.appointmentModel.find({
      clientId: new Types.ObjectId(clientId)
    })
      .populate('courseId', 'name type')
      .populate('professionalId', 'name email')
      .populate('paymentId')
      .sort({ startDate: 1 })
      .exec();
  }

  async getAppointmentAvailability(professionalId: string, date: Date): Promise<{ available: boolean, slots: any[] }> {
    if (!Types.ObjectId.isValid(professionalId)) {
      throw new BadRequestException('Invalid professional ID');
    }

    // Get professional to validate
    const professional = await this.usersService.findById(professionalId);
    
    // Get all appointments for this professional on the given date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingAppointments = await this.appointmentModel.find({
      professionalId: new Types.ObjectId(professionalId),
      startDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled', 'no-show'] }
    }).exec();
    
    // Generate time slots (assuming 9am-5pm with 1-hour slots)
    const slots = [];
    const workStart = 9; // 9am
    const workEnd = 17; // 5pm
    
    for (let hour = workStart; hour < workEnd; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);
      
      const isBooked = existingAppointments.some(appointment => {
        const appointmentStart = new Date(appointment.startDate);
        const appointmentEnd = new Date(appointment.endDate);
        
        return (
          (appointmentStart <= slotStart && appointmentEnd > slotStart) ||
          (appointmentStart < slotEnd && appointmentEnd >= slotEnd) ||
          (appointmentStart >= slotStart && appointmentEnd <= slotEnd)
        );
      });
      
      slots.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        available: !isBooked
      });
    }
    
    const hasAvailableSlot = slots.some(slot => slot.available);
    
    return {
      available: hasAvailableSlot,
      slots
    };
  }
}
