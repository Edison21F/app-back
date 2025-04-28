import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ClassesService } from '../classes/classes.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { PaymentsService } from '../payments/payments.service';
import { AttendanceService } from '../attendance/attendance.service';
import { BusinessesService } from '../businesses/businesses.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { Types } from 'mongoose';

@Injectable()
export class ReportsService {
  constructor(
    private usersService: UsersService,
    private classesService: ClassesService,
    private appointmentsService: AppointmentsService,
    private paymentsService: PaymentsService,
    private attendanceService: AttendanceService,
    private businessesService: BusinessesService,
  ) {}

  async getDashboardStats(businessId: string): Promise<any> {
    if (!Types.ObjectId.isValid(businessId)) {
      throw new BadRequestException('Invalid business ID');
    }

    // Verify business exists
    await this.businessesService.findById(businessId);

    // Get total users
    const users = await this.usersService.findByBusinessId(businessId);
    const totalUsers = users.length;

    // Count users by role
    const usersByRole = {
      admin: 0,
      student: 0,
      instructor: 0,
      professional: 0,
      receptionist: 0,
    };

    users.forEach(user => {
      if (usersByRole.hasOwnProperty(user.role)) {
        usersByRole[user.role]++;
      }
    });

    // Active vs inactive users
    const activeUsers = users.filter(user => user.isActive).length;
    const inactiveUsers = totalUsers - activeUsers;

    // Get revenue data
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);

    const revenueData = await this.paymentsService.getBusinessRevenue(businessId, sixMonthsAgo, today);

    // Get monthly revenue
    const currentMonthRevenue = await this.paymentsService.getBusinessRevenue(businessId, startOfMonth, today);

    // Get unpaid users
    const unpaidUsers = await this.paymentsService.getUnpaidUsers(businessId);

    // Get upcoming classes
    const upcomingClasses = await this.classesService.findUpcomingClasses(businessId, 7);

    return {
      userStats: {
        total: totalUsers,
        byRole: usersByRole,
        active: activeUsers,
        inactive: inactiveUsers,
      },
      financialStats: {
        totalRevenue: revenueData.total,
        monthlyRevenue: currentMonthRevenue.total,
        revenueByMonth: revenueData.byMonth,
        unpaidUsersCount: unpaidUsers.length,
      },
      upcomingClasses: upcomingClasses.length,
      lastUpdated: new Date(),
    };
  }

  async getBusinessMetrics(businessId: string, query: ReportQueryDto): Promise<any> {
    if (!Types.ObjectId.isValid(businessId)) {
      throw new BadRequestException('Invalid business ID');
    }

    // Set default date range if not provided
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate ? new Date(query.startDate) : new Date(endDate.getFullYear(), endDate.getMonth() - 3, 1);

    // Verify business exists
    await this.businessesService.findById(businessId);

    // Get total users and active users
    const users = await this.usersService.findByBusinessId(businessId);
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.isActive).length;

    // Get revenue data
    const revenueData = await this.paymentsService.getBusinessRevenue(businessId, startDate, endDate);

    // Get class/appointment statistics
    const classes = await this.classesService.findAll(
      businessId,
      undefined,
      undefined,
      startDate,
      endDate
    );

    const appointments = await this.appointmentsService.findAll(
      businessId,
      undefined,
      undefined,
      startDate,
      endDate
    );

    // Calculate class attendance (average)
    let totalCapacity = 0;
    let totalEnrolled = 0;

    classes.forEach(cls => {
      totalCapacity += cls.maxCapacity;
      totalEnrolled += cls.currentCapacity;
    });

    const averageClassOccupancy = totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0;

    // Calculate appointments statistics
    const completedAppointments = appointments.filter(app => app.status === 'completed').length;
    const cancelledAppointments = appointments.filter(app => app.status === 'cancelled' || app.status === 'no-show').length;
    const appointmentCompletionRate = appointments.length > 0 ? (completedAppointments / appointments.length) * 100 : 0;

    // Get payment status
    const payments = await this.paymentsService.findAll(businessId, undefined, undefined);
    const completedPayments = payments.filter(payment => payment.status === 'completed').length;
    const pendingPayments = payments.filter(payment => payment.status === 'pending').length;
    const failedPayments = payments.filter(payment => payment.status === 'failed').length;

    return {
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      userMetrics: {
        totalUsers,
        activeUsers,
        activeRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
      },
      financialMetrics: {
        totalRevenue: revenueData.total,
        revenueByMonth: revenueData.byMonth,
        averageRevenuePerUser: activeUsers > 0 ? revenueData.total / activeUsers : 0,
        paymentCompletion: {
          completed: completedPayments,
          pending: pendingPayments,
          failed: failedPayments,
          total: payments.length,
        },
      },
      activityMetrics: {
        totalClasses: classes.length,
        averageClassOccupancy,
        totalAppointments: appointments.length,
        appointmentCompletionRate,
        appointmentCancellationRate: appointments.length > 0 ? (cancelledAppointments / appointments.length) * 100 : 0,
      },
    };
  }

  async getUserActivityReport(businessId: string, userId: string, query: ReportQueryDto): Promise<any> {
    if (!Types.ObjectId.isValid(businessId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid ID format');
    }

    // Set default date range if not provided
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate ? new Date(query.startDate) : new Date(endDate.getFullYear(), endDate.getMonth() - 3, 1);

    // Verify user belongs to business
    const user = await this.usersService.findById(userId);
    if (user.businessId.toString() !== businessId) {
      throw new BadRequestException('User does not belong to this business');
    }

    // Get attendance data
    const attendanceStats = await this.attendanceService.getUserAttendanceStats(userId, businessId, startDate, endDate);

    // Get class participation (for students)
    let classParticipation = [];
    let appointmentHistory = [];

    if (user.role === 'student') {
      // Get classes the student is enrolled in
      const studentClasses = await this.classesService.findStudentClasses(userId);
      classParticipation = studentClasses.map(cls => ({
        classId: cls._id,
        className: cls.courseId['name'],
        instructorName: cls.instructorId['name'],
        startDate: cls.startDate,
        endDate: cls.endDate,
        status: cls.status,
      }));

      // Get appointments
      const studentAppointments = await this.appointmentsService.findClientAppointments(userId);
      appointmentHistory = studentAppointments.map(apt => ({
        appointmentId: apt._id,
        serviceName: apt.courseId['name'],
        professionalName: apt.professionalId['name'],
        startDate: apt.startDate,
        endDate: apt.endDate,
        status: apt.status,
        isPaid: apt.isPaid,
      }));
    }

    // Get payment history
    const paymentHistory = await this.paymentsService.getUserPaymentHistory(userId);
    const payments = paymentHistory.map(payment => ({
      paymentId: payment._id,
      amount: payment.amount,
      currency: payment.currency,
      date: payment.createdAt,
      status: payment.status,
      method: payment.paymentMethod,
      description: payment.description,
    }));

    // Get instructor/professional activity
    let instructedClasses = [];
    let conductedAppointments = [];

    if (user.role === 'instructor' || user.role === 'professional') {
      // Get classes taught
      const classes = await this.classesService.findInstructorClasses(userId, startDate, endDate);
      instructedClasses = classes.map(cls => ({
        classId: cls._id,
        className: cls.courseId['name'],
        startDate: cls.startDate,
        endDate: cls.endDate,
        status: cls.status,
        totalStudents: cls.enrolledStudents.length,
        maxCapacity: cls.maxCapacity,
        occupancyRate: cls.maxCapacity > 0 ? (cls.enrolledStudents.length / cls.maxCapacity) * 100 : 0,
      }));

      // Get appointments conducted
      const appointments = await this.appointmentsService.findAll(
        businessId,
        userId,
        undefined,
        startDate,
        endDate
      );

      conductedAppointments = appointments.map(apt => ({
        appointmentId: apt._id,
        serviceName: apt.courseId['name'],
        clientName: apt.clientId['name'],
        startDate: apt.startDate,
        endDate: apt.endDate,
        status: apt.status,
        isPaid: apt.isPaid,
      }));
    }

    return {
      userId,
      userName: user.name,
      email: user.email,
      role: user.role,
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      attendance: attendanceStats,
      payments: {
        total: payments.length,
        history: payments,
      },
      activity: {
        classParticipation,
        appointmentHistory,
        instructedClasses,
        conductedAppointments,
      },
    };
  }

  async getClassPerformanceReport(businessId: string, query: ReportQueryDto): Promise<any> {
    if (!Types.ObjectId.isValid(businessId)) {
      throw new BadRequestException('Invalid business ID');
    }

    // Set default date range if not provided
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate ? new Date(query.startDate) : new Date(endDate.getFullYear(), endDate.getMonth() - 3, 1);

    // Get all classes for the business in the date range
    const classes = await this.classesService.findAll(
      businessId,
      undefined,
      undefined,
      startDate,
      endDate
    );

    // Get all attendance records for those classes
    const classIds = classes.map(cls => cls._id);
    const attendanceRecords = await this.attendanceService.findAll(
      businessId,
      undefined,
      'class',
      undefined,
      startDate,
      endDate
    );

    // Filter attendance records for the selected classes
    const relevantAttendance = attendanceRecords.filter(record =>
      classIds.some(id => id.toString() === record.referenceId.toString())
    );

    // Calculate attendance rates by class
    const classStats = [];

    for (const cls of classes) {
      const classAttendance = relevantAttendance.filter(record =>
        record.referenceId.toString() === cls._id.toString()
      );

      const totalEnrolled = cls.enrolledStudents.length;
      const totalAttendanceRecords = classAttendance.length;

      // Count by status
      const statusCounts = {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      };

      classAttendance.forEach(record => {
        statusCounts[record.status]++;
      });

      // Calculate attendance rate
      const attendanceRate = totalEnrolled > 0
        ? (totalAttendanceRecords / totalEnrolled) * 100
        : 0;

      // Calculate percentage of present/late students
      const presentRate = totalAttendanceRecords > 0
        ? ((statusCounts.present + statusCounts.late) / totalAttendanceRecords) * 100
        : 0;

      classStats.push({
        classId: cls._id,
        className: cls.courseId['name'],
        instructor: cls.instructorId['name'],
        startDate: cls.startDate,
        endDate: cls.endDate,
        totalEnrolled,
        currentCapacity: cls.currentCapacity,
        maxCapacity: cls.maxCapacity,
        occupancyRate: cls.maxCapacity > 0 ? (cls.currentCapacity / cls.maxCapacity) * 100 : 0,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        presentRate: Math.round(presentRate * 10) / 10,
        statusCounts,
      });
    }

    // Sort classes by attendance rate (descending)
    classStats.sort((a, b) => b.attendanceRate - a.attendanceRate);

    // Calculate summary statistics
    const totalClasses = classes.length;
    const totalEnrollments = classes.reduce((sum, cls) => sum + cls.enrolledStudents.length, 0);
    const averageAttendanceRate = classStats.reduce((sum, stat) => sum + stat.attendanceRate, 0) / (totalClasses || 1);
    const averageOccupancyRate = classStats.reduce((sum, stat) => sum + stat.occupancyRate, 0) / (totalClasses || 1);

    return {
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      summary: {
        totalClasses,
        totalEnrollments,
        averageAttendanceRate: Math.round(averageAttendanceRate * 10) / 10,
        averageOccupancyRate: Math.round(averageOccupancyRate * 10) / 10,
      },
      classStats,
    };
  }

  async getFinancialReport(businessId: string, query: ReportQueryDto): Promise<any> {
    if (!Types.ObjectId.isValid(businessId)) {
      throw new BadRequestException('Invalid business ID');
    }

    // Set default date range if not provided
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate ? new Date(query.startDate) : new Date(endDate.getFullYear(), endDate.getMonth() - 3, 1);

    // Get revenue data
    const revenueData = await this.paymentsService.getBusinessRevenue(businessId, startDate, endDate);

    // Get all payments in the period
    const payments = await this.paymentsService.findAll(
      businessId,
      undefined,
      undefined,
      startDate,
      endDate
    );

    // Calculate payment method breakdown
    const paymentMethods = {
      stripe: 0,
      cash: 0,
      bank_transfer: 0,
      other: 0,
    };

    payments.forEach(payment => {
      if (payment.status === 'completed') {
        if (paymentMethods.hasOwnProperty(payment.paymentMethod)) {
          paymentMethods[payment.paymentMethod] += payment.amount;
        } else {
          paymentMethods.other += payment.amount;
        }
      }
    });

    // Calculate payment status breakdown
    const paymentStatuses = {
      completed: 0,
      pending: 0,
      failed: 0,
      refunded: 0,
    };

    payments.forEach(payment => {
      if (paymentStatuses.hasOwnProperty(payment.status)) {
        paymentStatuses[payment.status]++;
      }
    });

    // Get unpaid users
    const unpaidUsers = await this.paymentsService.getUnpaidUsers(businessId);

    // Calculate total amount by reference type
    const revenueByType = {
      class: 0,
      appointment: 0,
      subscription: 0,
      other: 0,
    };

    payments.forEach(payment => {
      if (payment.status === 'completed' && payment.referenceType) {
        if (revenueByType.hasOwnProperty(payment.referenceType)) {
          revenueByType[payment.referenceType] += payment.amount;
        } else {
          revenueByType.other += payment.amount;
        }
      }
    });

    return {
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      summary: {
        totalRevenue: revenueData.total,
        revenueByMonth: revenueData.byMonth,
        totalPayments: payments.length,
        averagePaymentAmount: payments.length > 0 ? revenueData.total / payments.length : 0,
        unpaidUsers: unpaidUsers.length,
      },
      breakdown: {
        byPaymentMethod: paymentMethods,
        byStatus: paymentStatuses,
        byReferenceType: revenueByType,
      },
      recentPayments: payments
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map(payment => ({
          id: payment._id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          method: payment.paymentMethod,
          date: payment.createdAt,
          description: payment.description,
          user: payment.userId['name'],
        })),
    };
  }
}
