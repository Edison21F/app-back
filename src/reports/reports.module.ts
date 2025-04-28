import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { UsersModule } from '../users/users.module';
import { ClassesModule } from '../classes/classes.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { PaymentsModule } from '../payments/payments.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { BusinessesModule } from '../businesses/businesses.module';

@Module({
  imports: [
    UsersModule,
    ClassesModule,
    AppointmentsModule,
    PaymentsModule,
    AttendanceModule,
    BusinessesModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
