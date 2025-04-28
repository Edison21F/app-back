import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Class } from './schemas/class.schema';

@ApiTags('classes')
@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Create new class' })
  @ApiResponse({ status: 201, description: 'Class created successfully', type: Class })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin or instructor role' })
  create(@Body() createClassDto: CreateClassDto) {
    return this.classesService.create(createClassDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all classes' })
  @ApiQuery({ name: 'businessId', required: false, description: 'Filter by business ID' })
  @ApiQuery({ name: 'instructorId', required: false, description: 'Filter by instructor ID' })
  @ApiQuery({ name: 'courseId', required: false, description: 'Filter by course ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO format)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiResponse({ status: 200, description: 'Returns list of classes', type: [Class] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('businessId') businessId?: string,
    @Query('instructorId') instructorId?: string,
    @Query('courseId') courseId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.classesService.findAll(
      businessId, 
      instructorId, 
      courseId, 
      start, 
      end, 
      status
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get class by ID' })
  @ApiParam({ name: 'id', description: 'Class ID' })
  @ApiResponse({ status: 200, description: 'Returns class', type: Class })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  findOne(@Param('id') id: string) {
    return this.classesService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Update class' })
  @ApiParam({ name: 'id', description: 'Class ID' })
  @ApiResponse({ status: 200, description: 'Class updated successfully', type: Class })
  @ApiResponse({ status: 400, description: 'Bad request or invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin or instructor role' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  update(@Param('id') id: string, @Body() updateClassDto: UpdateClassDto) {
    return this.classesService.update(id, updateClassDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete class' })
  @ApiParam({ name: 'id', description: 'Class ID' })
  @ApiResponse({ status: 200, description: 'Class deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid ID format or class has enrolled students' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin role' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }

  @Patch(':id/enroll/:studentId')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.STUDENT)
  @ApiOperation({ summary: 'Enroll student in class' })
  @ApiParam({ name: 'id', description: 'Class ID' })
  @ApiParam({ name: 'studentId', description: 'Student ID to enroll' })
  @ApiResponse({ status: 200, description: 'Student enrolled successfully', type: Class })
  @ApiResponse({ status: 400, description: 'Invalid ID format or class is full' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin, receptionist, or student role' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  enrollStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.classesService.enrollStudent(id, studentId);
  }

  @Patch(':id/remove/:studentId')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.STUDENT)
  @ApiOperation({ summary: 'Remove student from class' })
  @ApiParam({ name: 'id', description: 'Class ID' })
  @ApiParam({ name: 'studentId', description: 'Student ID to remove' })
  @ApiResponse({ status: 200, description: 'Student removed successfully', type: Class })
  @ApiResponse({ status: 400, description: 'Invalid ID format or student not enrolled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin, receptionist, or student role' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  removeStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.classesService.removeStudent(id, studentId);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  @ApiOperation({ summary: 'Update class status' })
  @ApiParam({ name: 'id', description: 'Class ID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully', type: Class })
  @ApiResponse({ status: 400, description: 'Invalid ID format or invalid status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin or instructor role' })
  @ApiResponse({ status: 404, description: 'Class not found' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.classesService.updateStatus(id, status);
  }

  @Get('business/:businessId/upcoming')
  @ApiOperation({ summary: 'Get upcoming classes for a business' })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days ahead to include' })
  @ApiResponse({ status: 200, description: 'Returns upcoming classes', type: [Class] })
  @ApiResponse({ status: 400, description: 'Invalid business ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findUpcomingClasses(
    @Param('businessId') businessId: string,
    @Query('days') days?: number,
  ) {
    return this.classesService.findUpcomingClasses(businessId, days ? Number(days) : undefined);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get classes for a student' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiResponse({ status: 200, description: 'Returns student classes', type: [Class] })
  @ApiResponse({ status: 400, description: 'Invalid student ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findStudentClasses(@Param('studentId') studentId: string) {
    return this.classesService.findStudentClasses(studentId);
  }

  @Get('instructor/:instructorId')
  @ApiOperation({ summary: 'Get classes for an instructor' })
  @ApiParam({ name: 'instructorId', description: 'Instructor ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO format)' })
  @ApiResponse({ status: 200, description: 'Returns instructor classes', type: [Class] })
  @ApiResponse({ status: 400, description: 'Invalid instructor ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findInstructorClasses(
    @Param('instructorId') instructorId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.classesService.findInstructorClasses(instructorId, start, end);
  }
}
