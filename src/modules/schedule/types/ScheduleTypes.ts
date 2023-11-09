import {
  DAY_OF_WEEK,
  SchedulePeriod,
  SchedulePeriodAvailability,
  SchedulePeriodDemand,
  TIME_OF_DAY,
  User,
  UserSchedulePeriod,
} from "@prisma/client";

export type FullScheduleDetails = SchedulePeriod & {
  schedulePeriodDemand: SchedulePeriodDemand[];
  schedulePeriodAvailability: SchedulePeriodAvailability[];
  userSchedulePeriod: UserSchedulePeriod[];
};

export type CompanyScheduleDetails = SchedulePeriod & {
  schedulePeriodDemand: SchedulePeriodDemand[];
  userSchedulePeriod: UserSchedulePeriod[];
};

export type FullUserScheduleDetails = UserSchedulePeriod & {
  schedulePeriodDemand: SchedulePeriodDemand;
  schedulePeriod: SchedulePeriod;
};

export type UserScheduleDemand = UserSchedulePeriod & {
  schedulePeriodDemand: SchedulePeriodDemand;
};

export type UserScheduleDemandWithUser = UserSchedulePeriod & {
  schedulePeriodDemand: SchedulePeriodDemand;
  user: User;
};

export type FullUserDemand = UserSchedulePeriod & {
  user: User;
};

export type ScheduleDemandAndUsers = SchedulePeriodDemand & {
  userSchedulePeriod: UserSchedulePeriod[];
  schedulePeriod: SchedulePeriod;
};

export type CreateScheduleResponse = {
  message: string;
  data: CreateScheduleData;
};

export type CreateScheduleData = {
  id: string;
  title: string;
  isPublished: boolean;
  repeat: boolean;
  data: PeriodDemand[] | PeriodDemandWithoutUser[];
};

export type PeriodDemandResponse = {
  message: string;
  id: string;
  day: DAY_OF_WEEK;
  timeFrame: TIME_OF_DAY;
  startTime: string;
  endTime: string;
  neededWorkers: number;
  availableWorkers: number;
  status: string;
  workers: UserAvailability[];
};

export type PeriodDemand = {
  id: string;
  day: DAY_OF_WEEK;
  timeFrame: TIME_OF_DAY;
  startTime: string;
  endTime: string;
  neededWorkers: number;
  availableWorkers: number;
  status: string;
  workers: UserAvailability[];
};

export type PeriodDemandWithoutUser = {
  id: string;
  day: DAY_OF_WEEK;
  timeFrame: TIME_OF_DAY;
  startTime: string;
  endTime: string;
  neededWorkers: number;
};

export type UserAvailability = {
  userId: string;
  avatar: string | null;
  fullName: string;
  email: string;
};

export type UserShiftResponse = {
  message: string;
  shifts: UserShiftDetails[];
  total: number | null;
  lastpage: number | null;
  nextpage: number | null;
  prevpage: number | null;
};

export type UserShiftDetails = {
  userId: string;
  week: number;
  year: number;
  weekDay: DAY_OF_WEEK;
  startTime: string;
  endTime: string;
  timeFrame: TIME_OF_DAY;
  periodName: string;
  periodId: string;
  periodDemandId: string;
  userPeriodId: string;
};

export type CompanySchedule = {
  id: string;
  periodDemand: any[];
};
