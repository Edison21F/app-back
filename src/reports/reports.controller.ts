import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ReportQueryDto } from './dto/report-query.dto';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard/:businessId')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @ApiResponse({ status: 200, description: 'Returns dashboard statistics' })
  @ApiResponse({ status: 400, description: 'Invalid business ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin or receptionist role' })
  getDashboardStats(@Param('businessId') businessId: string) {
    return this.reportsService.getDashboardStats(businessId);
  }

  @Get('business/:businessId/metrics')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get business metrics' })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @ApiResponse({ status: 200, description: 'Returns business metrics' })
  @ApiResponse({ status: 400, description: 'Invalid business ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin role' })
  getBusinessMetrics(
    @Param('businessId') businessId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getBusinessMetrics(businessId, query);
  }

  @Get('user/:businessId/:userId')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.PROFESSIONAL, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get user activity report' })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns user activity report' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires appropriate role' })
  getUserActivityReport(
    @Param('businessId') businessId: string,
    @Param('userId') userId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getUserActivityReport(businessId, userId, query);
  }

  @Get('class/:businessId/performance')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.PROFESSIONAL)
  @ApiOperation({ summary: 'Get class performance report' })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @ApiResponse({ status: 200, description: 'Returns class performance report' })
  @ApiResponse({ status: 400, description: 'Invalid business ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires appropriate role' })
  getClassPerformanceReport(
    @Param('businessId') businessId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getClassPerformanceReport(businessId, query);
  }

  @Get('financial/:businessId')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get financial report' })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @ApiResponse({ status: 200, description: 'Returns financial report' })
  @ApiResponse({ status: 400, description: 'Invalid business ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin or receptionist role' })
  getFinancialReport(
    @Param('businessId') businessId: string,
    @Query() query: ReportQueryDto,
  ) {
    return this.reportsService.getFinancialReport(businessId, query);
  }
}
