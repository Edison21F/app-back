import { IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportQueryDto {
  @ApiProperty({
    example: '2023-01-01',
    description: 'Start date for report period (YYYY-MM-DD)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    example: '2023-12-31',
    description: 'End date for report period (YYYY-MM-DD)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
