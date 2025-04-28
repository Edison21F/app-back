import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { Attendance } from './schemas/attendance.schema';

@ApiTags('attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.PROFESSIONAL, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Create attendance record' })
  @ApiResponse({ status: 201, description: 'Attendance record created successfully', type: Attendance })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires appropriate role' })
  create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendanceService.create(createAttendanceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all attendance records' })
  @ApiQuery({ name: 'businessId', required: false, description: 'Filter by business ID' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'referenceType', required: false, description: 'Filter by reference type (class or appointment)' })
  @ApiQuery({ name: 'referenceId', required: false, description: 'Filter by reference ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO format)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'Returns list of attendance records', type: [Attendance] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('businessId') businessId?: string,
    @Query('userId') userId?: string,
    @Query('referenceType') referenceType?: string,
    @Query('referenceId') referenceId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.attendanceService.findAll(
      businessId,
      userId,
      referenceType,
      referenceId,
      start,
      end,
      status
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attendance record by ID' })
  @ApiParam({ name: 'id', description: 'Attendance record ID' })
  @ApiResponse({ status: 200, description: 'Returns attendance record', type: Attendance })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  findOne(@Param('id') id: string) {
    return this.attendanceService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.PROFESSIONAL, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Update attendance record' })
  @ApiParam({ name: 'id', description: 'Attendance record ID' })
  @ApiResponse({ status: 200, description: 'Attendance record updated successfully', type: Attendance })
  @ApiResponse({ status: 400, description: 'Bad request or invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires appropriate role' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  update(
    @Param('id') id: string,
    @Body() updateAttendanceDto: any,
  ) {
    return this.attendanceService.update(id, updateAttendanceDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete attendance record' })
  @ApiParam({ name: 'id', description: 'Attendance record ID' })
  @ApiResponse({ status: 200, description: 'Attendance record deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin role' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  remove(@Param('id') id: string) {
    return this.attendanceService.remove(id);
  }

  @Get('user/:userId/stats')
  @ApiOperation({ summary: 'Get attendance statistics for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'businessId', required: true, description: 'Business ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO format)' })
  @ApiResponse({ status: 200, description: 'Returns user attendance statistics' })
  @ApiResponse({ status: 400, description: 'Invalid user ID or business ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getUserStats(
    @Param('userId') userId: string,
    @Query('businessId') businessId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.attendanceService.getUserAttendanceStats(userId, businessId, start, end);
  }

  @Get('class/:classId/stats')
  @ApiOperation({ summary: 'Get attendance statistics for a class' })
  @ApiParam({ name: 'classId', description: 'Class ID' })
  @ApiResponse({ status: 200, description: 'Returns class attendance statistics' })
  @ApiResponse({ status: 400, description: 'Invalid class ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getClassStats(@Param('classId') classId: string) {
    return this.attendanceService.getClassAttendanceStats(classId);
  }

  @Post('bulk-mark')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.PROFESSIONAL, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Bulk mark attendance for multiple users' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        referenceType: { type: 'string', example: 'class' },
        referenceId: { type: 'string', example: '60d0fe4f5311236168a109ca' },
        userStatusList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'string', example: '60d0fe4f5311236168a109cb' },
              status: { type: 'string', example: 'present' }
            }
          }
        },
        markedBy: { type: 'string', example: '60d0fe4f5311236168a109cc' }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Attendance records created/updated successfully', type: [Attendance] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires appropriate role' })
  bulkMarkAttendance(
    @Body('referenceType') referenceType: string,
    @Body('referenceId') referenceId: string,
    @Body('userStatusList') userStatusList: { userId: string, status: string }[],
    @Body('markedBy') markedBy: string,
  ) {
    return this.attendanceService.bulkMarkAttendance(
      referenceType,
      referenceId,
      userStatusList,
      markedBy
    );
  }
}
