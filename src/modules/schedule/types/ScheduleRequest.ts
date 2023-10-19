import { DAY_OF_WEEK, TIME_OF_DAY } from '@prisma/client'
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator'

export class CreateScheduleRequest {
  @IsString()
  title: string

  @IsBoolean()
  repeat: boolean

  @IsNumber()
  maxHoursBefore: number

  @IsNumber()
  maxHoursAfter: number

  @IsArray()
  availabilty: CreateSchedulePeriodRequest[]
}

export class ViewScheduleRequest {
  @IsString()
  week: number

  @IsString()
  year: number
}

export class CreateSchedulePeriodRequest {
  @IsEnum(DAY_OF_WEEK)
  day: DAY_OF_WEEK

  @IsArray()
  data: CreateScheduleTimeRequest[]
}

export class CreateScheduleTimeRequest {
  @IsEnum(TIME_OF_DAY)
  time: TIME_OF_DAY

  @IsDate()
  startTime: Date

  @IsDate()
  endTime: Date

  @IsNumber()
  userCount: number
}
