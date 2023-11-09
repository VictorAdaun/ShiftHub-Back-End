import { TIME_OFF_REQUEST } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDate, IsEnum, IsOptional, IsString } from "class-validator";

export class TimeOffRequest {
  @IsEnum(TIME_OFF_REQUEST)
  @IsString()
  type: TIME_OFF_REQUEST;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsString()
  @IsOptional()
  reason: string;
}

export class EditTimeOffRequest {
  @IsEnum(TIME_OFF_REQUEST)
  @IsString()
  @IsOptional()
  type: TIME_OFF_REQUEST;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate: Date;

  @IsString()
  @IsOptional()
  reason: string;
}
