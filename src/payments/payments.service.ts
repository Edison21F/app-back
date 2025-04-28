import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { StripePaymentDto } from './dto/stripe-payment.dto';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { BusinessesService } from '../businesses/businesses.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private configService: ConfigService,
    private usersService: UsersService,
    private businessesService: BusinessesService,
  ) {
    // Initialize Stripe with API key
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-08-16', // Using compatible API version
      });
    }
  }

  async create(createPaymentDto: CreatePaymentDto): Promise<PaymentDocument> {
    // Check if business exists
    if (createPaymentDto.businessId) {
      await this.businessesService.findById(createPaymentDto.businessId.toString());
    }

    // Check if user exists
    if (createPaymentDto.userId) {
      await this.usersService.findById(createPaymentDto.userId.toString());
    }

    // If it's a manual payment, check if receivedBy user exists and has permission
    if (createPaymentDto.paymentMethod === 'cash' || createPaymentDto.paymentMethod === 'bank_transfer') {
      if (!createPaymentDto.receivedBy) {
        throw new BadRequestException('Manual payments require a receptionist');
      }

      const receptionist = await this.usersService.findById(createPaymentDto.receivedBy.toString());
      
      if (receptionist.role !== 'receptionist') {
        throw new BadRequestException('Only receptionists can receive manual payments');
      }
      
      if (!receptionist.canAcceptPayments) {
        throw new BadRequestException('This receptionist is not authorized to accept payments');
      }
    }

    const newPayment = new this.paymentModel(createPaymentDto);
    return newPayment.save();
  }

  async findAll(businessId?: string, userId?: string, status?: string): Promise<PaymentDocument[]> {
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
    
    if (status) {
      query.status = status;
    }
    
    return this.paymentModel.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('receivedBy', 'name')
      .exec();
  }

  async findById(id: string): Promise<PaymentDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid payment ID');
    }

    const payment = await this.paymentModel.findById(id)
      .populate('userId', 'name email')
      .populate('receivedBy', 'name')
      .exec();
    
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    
    return payment;
  }

  async createStripePaymentIntent(stripePaymentDto: StripePaymentDto): Promise<{ clientSecret: string }> {
    if (!this.stripe) {
      throw new InternalServerErrorException('Stripe is not configured');
    }

    const { amount, currency, businessId, userId, description, metadata } = stripePaymentDto;

    try {
      // First, get the user to check their Stripe customer ID
      const user = await this.usersService.findById(userId);
      
      // Create or retrieve a customer in Stripe
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await this.stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: user.id,
            businessId,
          },
        });
        
        customerId = customer.id;
        
        // Update user with Stripe customer ID
        await this.usersService.updateStripeCustomerId(userId, customerId);
      }
      
      // Create a PaymentIntent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency || 'usd',
        customer: customerId,
        description,
        metadata: {
          ...metadata,
          userId,
          businessId,
        },
      });
      
      // Create a pending payment record
      await this.create({
        businessId: new Types.ObjectId(businessId),
        userId: new Types.ObjectId(userId),
        amount,
        currency: currency || 'usd',
        paymentMethod: 'stripe',
        status: 'pending',
        description,
        stripePaymentIntentId: paymentIntent.id,
        metadata,
      });
      
      return { clientSecret: paymentIntent.client_secret };
    } catch (error) {
      throw new InternalServerErrorException(`Stripe payment creation failed: ${error.message}`);
    }
  }

  async handleStripeWebhook(payload: any, signature: string): Promise<any> {
    if (!this.stripe) {
      throw new InternalServerErrorException('Stripe is not configured');
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      throw new InternalServerErrorException('Stripe webhook secret is not configured');
    }
    
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
      
      // Handle the event based on its type
      switch (event.type) {
        case 'payment_intent.succeeded':
          return this.handlePaymentIntentSucceeded(event.data.object);
        
        case 'payment_intent.payment_failed':
          return this.handlePaymentIntentFailed(event.data.object);
          
        default:
          return { received: true };
      }
    } catch (error) {
      throw new BadRequestException(`Webhook error: ${error.message}`);
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: any): Promise<any> {
    // Find the corresponding payment by Stripe payment intent ID
    const payment = await this.paymentModel.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });
    
    if (!payment) {
      throw new NotFoundException('Payment record not found for this payment intent');
    }
    
    // Update payment status to completed
    payment.status = 'completed';
    payment.receiptUrl = paymentIntent.charges.data[0]?.receipt_url;
    await payment.save();
    
    return { updated: true, paymentId: payment.id };
  }

  private async handlePaymentIntentFailed(paymentIntent: any): Promise<any> {
    // Find the corresponding payment by Stripe payment intent ID
    const payment = await this.paymentModel.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });
    
    if (!payment) {
      throw new NotFoundException('Payment record not found for this payment intent');
    }
    
    // Update payment status to failed
    payment.status = 'failed';
    await payment.save();
    
    return { updated: true, paymentId: payment.id };
  }

  async getBusinessRevenue(businessId: string, startDate?: Date, endDate?: Date): Promise<{ total: number, byMonth: Record<string, number> }> {
    if (!Types.ObjectId.isValid(businessId)) {
      throw new BadRequestException('Invalid business ID');
    }

    // Set default date range if not provided
    const end = endDate || new Date();
    const start = startDate || new Date(end.getFullYear(), end.getMonth() - 6, 1); // Default 6 months back
    
    // Create match stage for query
    const matchStage = {
      businessId: new Types.ObjectId(businessId),
      status: 'completed',
      createdAt: {
        $gte: start,
        $lte: end,
      },
    };
    
    // Get total revenue
    const totalResult = await this.paymentModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]).exec();
    
    const total = totalResult.length > 0 ? totalResult[0].total : 0;
    
    // Get revenue by month
    const byMonthResult = await this.paymentModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]).exec();
    
    // Format the result by month
    const byMonth: Record<string, number> = {};
    
    byMonthResult.forEach(item => {
      const { year, month } = item._id;
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      byMonth[key] = item.total;
    });
    
    return { total, byMonth };
  }

  async getUserPaymentHistory(userId: string): Promise<PaymentDocument[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.paymentModel.find({
      userId: new Types.ObjectId(userId),
    })
    .sort({ createdAt: -1 })
    .exec();
  }

  async getUnpaidUsers(businessId: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(businessId)) {
      throw new BadRequestException('Invalid business ID');
    }

    // Get all users for the business
    const users = await this.usersService.findByBusinessId(businessId);
    
    // For each user, get their last payment
    const results = [];
    
    for (const user of users) {
      const lastPayment = await this.paymentModel.findOne({
        userId: user._id,
        status: 'completed',
      })
      .sort({ createdAt: -1 })
      .exec();
      
      // If no payment or last payment was more than 30 days ago, add to results
      const isUnpaid = !lastPayment || 
                       (new Date().getTime() - new Date(lastPayment.createdAt).getTime()) > (30 * 24 * 60 * 60 * 1000);
      
      if (isUnpaid) {
        results.push({
          userId: user._id,
          name: user.name,
          email: user.email,
          lastPaymentDate: lastPayment ? lastPayment.createdAt : null,
          daysSinceLastPayment: lastPayment 
            ? Math.floor((new Date().getTime() - new Date(lastPayment.createdAt).getTime()) / (24 * 60 * 60 * 1000))
            : null,
        });
      }
    }
    
    return results;
  }
}
