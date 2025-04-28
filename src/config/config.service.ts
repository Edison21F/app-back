import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get mongodbUri(): string {
    return this.configService.get<string>('MONGODB_URI');
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET', 'supersecret');
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN', '1d');
  }

  get stripeSecretKey(): string {
    return this.configService.get<string>('STRIPE_SECRET_KEY', '');
  }

  get stripeWebhookSecret(): string {
    return this.configService.get<string>('STRIPE_WEBHOOK_SECRET', '');
  }

  get corsOrigins(): string[] {
    const originsString = this.configService.get<string>('CORS_ORIGINS', '');
    return originsString ? originsString.split(',') : [];
  }

  get emailSenderAddress(): string {
    return this.configService.get<string>('EMAIL_SENDER_ADDRESS', '');
  }

  get sendgridApiKey(): string {
    return this.configService.get<string>('SENDGRID_API_KEY', '');
  }

  get port(): number {
    return this.configService.get<number>('PORT', 8000);
  }
}
