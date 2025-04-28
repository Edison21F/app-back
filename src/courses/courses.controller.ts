import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Course } from './schemas/course.schema';

@ApiTags('courses')
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new course' })
  @ApiResponse({ status: 201, description: 'Course created successfully', type: Course })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin role' })
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiQuery({ name: 'businessId', required: false, description: 'Filter by business ID' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiResponse({ status: 200, description: 'Returns list of courses', type: [Course] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('businessId') businessId?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.coursesService.findAll(businessId, isActive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Returns course', type: Course })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  findOne(@Param('id') id: string) {
    return this.coursesService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course updated successfully', type: Course })
  @ApiResponse({ status: 400, description: 'Bad request or invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin role' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin role' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  @Get('instructor/:instructorId')
  @ApiOperation({ summary: 'Get courses by instructor ID' })
  @ApiParam({ name: 'instructorId', description: 'Instructor ID' })
  @ApiResponse({ status: 200, description: 'Returns list of courses for instructor', type: [Course] })
  @ApiResponse({ status: 400, description: 'Invalid instructor ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findByInstructor(@Param('instructorId') instructorId: string) {
    return this.coursesService.findByInstructor(instructorId);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course activated successfully', type: Course })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin role' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  activate(@Param('id') id: string) {
    return this.coursesService.activateCourse(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course deactivated successfully', type: Course })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin role' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  deactivate(@Param('id') id: string) {
    return this.coursesService.deactivateCourse(id);
  }

  @Patch(':id/instructors/add/:instructorId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add instructor to course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiParam({ name: 'instructorId', description: 'Instructor ID to add' })
  @ApiResponse({ status: 200, description: 'Instructor added successfully', type: Course })
  @ApiResponse({ status: 400, description: 'Invalid ID format or business mismatch' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin role' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  addInstructor(
    @Param('id') id: string,
    @Param('instructorId') instructorId: string,
  ) {
    return this.coursesService.addInstructor(id, instructorId);
  }

  @Patch(':id/instructors/remove/:instructorId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove instructor from course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiParam({ name: 'instructorId', description: 'Instructor ID to remove' })
  @ApiResponse({ status: 200, description: 'Instructor removed successfully', type: Course })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin role' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  removeInstructor(
    @Param('id') id: string,
    @Param('instructorId') instructorId: string,
  ) {
    return this.coursesService.removeInstructor(id, instructorId);
  }
}
