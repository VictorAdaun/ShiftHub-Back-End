import { PRIORITY, TASK_ASSIGNED, TASK_STATUS } from "@prisma/client";
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateTaskRequest {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsBoolean()
  isDraft: boolean;

  @IsDate()
  startDate: Date;

  @IsDate()
  endDate: Date;

  @IsEnum(TASK_ASSIGNED)
  assignType: TASK_ASSIGNED;

  @IsEnum(TASK_STATUS)
  status: TASK_STATUS;

  @IsEnum(PRIORITY)
  priority: PRIORITY;

  @IsOptional()
  @IsArray()
  employees: {
    id: string;
    isTaskLead: boolean;
  }[];

  @IsArray()
  notes: string[];
}

export class CreateDraftTaskRequest {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;

  @IsDate()
  @IsOptional()
  startDate: Date;

  @IsDate()
  @IsOptional()
  endDate: Date;

  @IsEnum(TASK_ASSIGNED)
  @IsOptional()
  assignType?: TASK_ASSIGNED;

  @IsEnum(TASK_STATUS)
  @IsOptional()
  status?: TASK_STATUS;

  @IsEnum(PRIORITY)
  @IsOptional()
  priority?: PRIORITY;

  @IsOptional()
  @IsArray()
  @IsOptional()
  employees?: {
    id: string;
    isTaskLead: boolean;
  }[];

  @IsArray()
  @IsOptional()
  notes?: string[];
}

export class UpdateNoteRequest {
  @IsString()
  note: string;
}
