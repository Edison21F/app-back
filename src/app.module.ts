import { Module, MiddlewareConsumer, RequestMethod, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BusinessesModule } from './businesses/businesses.module';
import { CoursesModule } from './courses/courses.module';
import { ClassesModule } from './classes/classes.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PaymentsModule } from './payments/payments.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ReportsModule } from './reports/reports.module';

// Initialize MongoDB Memory Server for development
let mongoMemoryServer: MongoMemoryServer;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const env = configService.get<string>('NODE_ENV');
        
        // Use in-memory MongoDB for development
        if (env === 'development') {
          mongoMemoryServer = await MongoMemoryServer.create();
          const uri = mongoMemoryServer.getUri();
          console.log(`Using MongoDB Memory Server: ${uri}`);
          return {
            uri,
            useNewUrlParser: true,
            useUnifiedTopology: true,
          };
        }
        
        // Use configured MongoDB URI for production
        return {
          uri: configService.get<string>('MONGODB_URI'),
          useNewUrlParser: true,
          useUnifiedTopology: true,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    BusinessesModule,
    CoursesModule,
    ClassesModule,
    AppointmentsModule,
    PaymentsModule,
    AttendanceModule,
    ReportsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements OnModuleInit {
  configure(consumer: MiddlewareConsumer) {
    // Apply tenant middleware to all routes except auth
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'auth/(.*)', method: RequestMethod.ALL },
        { path: 'api/docs', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }

  // Create initial data for testing
  async onModuleInit() {
    // Add shutdown hook for the MongoDB Memory Server
    process.on('SIGINT', async () => {
      if (mongoMemoryServer) {
        await mongoMemoryServer.stop();
        console.log('MongoDB Memory Server stopped');
      }
      process.exit(0);
    });
  }
}
