import { Controller, Get, Post, Body, Param, Query, UseGuards, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { StripePaymentDto } from './dto/stripe-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiHeader, ApiBody } from '@nestjs/swagger';
import { Payment } from './schemas/payment.schema';
import { Public } from '../common/decorators/public.decorator';
import { Request } from 'express';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Create manual payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully', type: Payment })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin or receptionist role' })
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Post('stripe/create-payment-intent')
  @ApiOperation({ summary: 'Create Stripe payment intent' })
  @ApiResponse({ status: 201, description: 'Payment intent created', type: Object })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createStripePaymentIntent(@Body() stripePaymentDto: StripePaymentDto) {
    return this.paymentsService.createStripePaymentIntent(stripePaymentDto);
  }

  @Post('stripe/webhook')
  @Public()
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiHeader({ name: 'stripe-signature', description: 'Stripe signature header' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook payload' })
  handleStripeWebhook(@Req() request: RawBodyRequest<Request>, @Headers('stripe-signature') signature: string) {
    return this.paymentsService.handleStripeWebhook(request.rawBody, signature);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  @ApiQuery({ name: 'businessId', required: false, description: 'Filter by business ID' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by payment status' })
  @ApiResponse({ status: 200, description: 'Returns list of payments', type: [Payment] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @Query('businessId') businessId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.findAll(businessId, userId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Returns payment', type: Payment })
  @ApiResponse({ status: 400, description: 'Invalid ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }

  @Get('business/:businessId/revenue')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get business revenue' })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Returns business revenue data' })
  @ApiResponse({ status: 400, description: 'Invalid business ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin role' })
  getBusinessRevenue(
    @Param('businessId') businessId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.paymentsService.getBusinessRevenue(businessId, start, end);
  }

  @Get('user/:userId/history')
  @ApiOperation({ summary: 'Get user payment history' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns user payment history', type: [Payment] })
  @ApiResponse({ status: 400, description: 'Invalid user ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getUserPaymentHistory(@Param('userId') userId: string) {
    return this.paymentsService.getUserPaymentHistory(userId);
  }

  @Get('business/:businessId/unpaid-users')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get users with overdue payments' })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @ApiResponse({ status: 200, description: 'Returns list of users with overdue payments' })
  @ApiResponse({ status: 400, description: 'Invalid business ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin or receptionist role' })
  getUnpaidUsers(@Param('businessId') businessId: string) {
    return this.paymentsService.getUnpaidUsers(businessId);
  }
}
