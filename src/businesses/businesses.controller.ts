import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Business } from './schemas/business.schema';

@ApiTags('businesses')
@Controller('businesses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new business' })
  @ApiResponse({ status: 201, description: 'Business created successfully', type: Business })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin role' })
  create(@Body() createBusinessDto: CreateBusinessDto) {
    return this.businessesService.create(createBusinessDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all businesses' })
  @ApiResponse({ status: 200, description: 'Returns list of businesses', type: [Business] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin role' })
  findAll() {
    return this.businessesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get business by ID' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({ status: 200, description: 'Returns business', type: Business })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  findOne(@Param('id') id: string) {
    return this.businessesService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update business' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({ status: 200, description: 'Business updated successfully', type: Business })
  @ApiResponse({ status: 400, description: 'Bad request or invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin role' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  update(@Param('id') id: string, @Body() updateBusinessDto: UpdateBusinessDto) {
    return this.businessesService.update(id, updateBusinessDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete business' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({ status: 200, description: 'Business deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin role' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  remove(@Param('id') id: string) {
    return this.businessesService.remove(id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate business' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({ status: 200, description: 'Business activated successfully', type: Business })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin role' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  activate(@Param('id') id: string) {
    return this.businessesService.activateBusiness(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate business' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({ status: 200, description: 'Business deactivated successfully', type: Business })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin role' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  deactivate(@Param('id') id: string) {
    return this.businessesService.deactivateBusiness(id);
  }

  @Patch(':id/administrators/add/:userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add administrator to business' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiParam({ name: 'userId', description: 'User ID to add as administrator' })
  @ApiResponse({ status: 200, description: 'Administrator added successfully', type: Business })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin role' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  addAdministrator(@Param('id') id: string, @Param('userId') userId: string) {
    return this.businessesService.addAdministrator(id, userId);
  }

  @Patch(':id/administrators/remove/:userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove administrator from business' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiParam({ name: 'userId', description: 'User ID to remove as administrator' })
  @ApiResponse({ status: 200, description: 'Administrator removed successfully', type: Business })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin role' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  removeAdministrator(@Param('id') id: string, @Param('userId') userId: string) {
    return this.businessesService.removeAdministrator(id, userId);
  }

  @Patch(':id/stripe-settings')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update Stripe settings for business' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiResponse({ status: 200, description: 'Stripe settings updated successfully', type: Business })
  @ApiResponse({ status: 400, description: 'Invalid ID format or bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin role' })
  @ApiResponse({ status: 404, description: 'Business not found' })
  updateStripeSettings(
    @Param('id') id: string,
    @Body('stripeAccountId') stripeAccountId: string,
    @Body('stripeEnabled') stripeEnabled: boolean,
  ) {
    return this.businessesService.updateStripeSettings(id, stripeAccountId, stripeEnabled);
  }
}
