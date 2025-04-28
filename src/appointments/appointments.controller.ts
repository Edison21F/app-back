import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Appointment } from './schemas/appointment.schema';

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.STUDENT, UserRole.PROFESSIONAL)
  @ApiOperation({ summary: 'Create new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created successfully', type: Appointment })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires appropriate role' })
  create(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all appointments' })
  @ApiQuery({ name: 'businessId', required: false, description: 'Filter by business ID' })
  @ApiQuery({ name: 'professionalId', required: false, description: 'Filter by professional ID' })
  @ApiQuery({ name: 'clientId', required: false, description: 'Filter by client ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO format)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'isPaid', required: false, type: Boolean, description: 'Filter by payment status' })
  @ApiResponse({ status: 200, description: 'Returns list of appointments', type: [Appointment] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('businessId') businessId?: string,
    @Query('professionalId') professionalId?: string,
    @Query('clientId') clientId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('isPaid') isPaid?: boolean,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const paid = isPaid !== undefined ? isPaid === true : undefined;
    
    return this.appointmentsService.findAll(
      businessId, 
      professionalId, 
      clientId, 
      start, 
      end, 
      status,
      paid
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({ status: 200, description: 'Returns appointment', type: Appointment })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.PROFESSIONAL)
  @ApiOperation({ summary: 'Update appointment' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully', type: Appointment })
  @ApiResponse({ status: 400, description: 'Bad request or invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires appropriate role' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Delete appointment' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({ status: 200, description: 'Appointment deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid ID format or appointment is paid' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin or receptionist role' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.PROFESSIONAL)
  @ApiOperation({ summary: 'Update appointment status' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully', type: Appointment })
  @ApiResponse({ status: 400, description: 'Invalid ID format or invalid status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires appropriate role' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.appointmentsService.updateStatus(id, status);
  }

  @Patch(':id/payment')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Update appointment payment information' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @ApiResponse({ status: 200, description: 'Payment info updated successfully', type: Appointment })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin or receptionist role' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  updatePaymentInfo(
    @Param('id') id: string,
    @Body('paymentId') paymentId: string,
    @Body('isPaid') isPaid: boolean,
  ) {
    return this.appointmentsService.updatePaymentInfo(id, paymentId, isPaid);
  }

  @Get('professional/:professionalId/upcoming')
  @ApiOperation({ summary: 'Get upcoming appointments for a professional' })
  @ApiParam({ name: 'professionalId', description: 'Professional ID' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days ahead to include' })
  @ApiResponse({ status: 200, description: 'Returns upcoming appointments', type: [Appointment] })
  @ApiResponse({ status: 400, description: 'Invalid professional ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findUpcomingAppointments(
    @Param('professionalId') professionalId: string,
    @Query('days') days?: number,
  ) {
    return this.appointmentsService.findUpcomingAppointments(professionalId, days ? Number(days) : undefined);
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get appointments for a client' })
  @ApiParam({ name: 'clientId', description: 'Client ID' })
  @ApiResponse({ status: 200, description: 'Returns client appointments', type: [Appointment] })
  @ApiResponse({ status: 400, description: 'Invalid client ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findClientAppointments(@Param('clientId') clientId: string) {
    return this.appointmentsService.findClientAppointments(clientId);
  }

  @Get('availability/:professionalId')
  @ApiOperation({ summary: 'Get professional availability for appointments' })
  @ApiParam({ name: 'professionalId', description: 'Professional ID' })
  @ApiQuery({ name: 'date', required: true, description: 'Date to check (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Returns availability information' })
  @ApiResponse({ status: 400, description: 'Invalid professional ID or date format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getAvailability(
    @Param('professionalId') professionalId: string,
    @Query('date') dateString: string,
  ) {
    const date = new Date(dateString);
    return this.appointmentsService.getAppointmentAvailability(professionalId, date);
  }
}
