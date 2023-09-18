import { DAY_OF_WEEK } from '@prisma/client'
import { IsEnum, IsOptional, IsString } from 'class-validator'

export class EditOrganizationRequest {
  @IsString()
  @IsOptional()
  companyName: string

  @IsString()
  @IsOptional()
  companyAddress: string

  @IsEnum(DAY_OF_WEEK)
  @IsOptional()
  scheduleStartDay: DAY_OF_WEEK
}
