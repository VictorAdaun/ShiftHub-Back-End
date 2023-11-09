import {
  STATUS,
  SwapShifts,
  TIME_OFF_REQUEST,
  TimeOff,
  User,
  UserSchedulePeriod,
} from "@prisma/client";
import { UserSchema } from "../../user/types/AuthTypes";
import { PeriodDemandWithoutUser } from "../../schedule/types/ScheduleTypes";

export type Request = {
  id: string;
  type: TIME_OFF_REQUEST | null;
  status: string;
  startDate: Date;
  endDate: Date;
  timeFrame: string;
  reason: string | null | undefined;
  user?: UserSchema;
};

export type TimeOffUser = TimeOff & {
  user: User;
};

export type EmployeeShift = {
  userScheduleId: string;
  user: UserSchema;
  periodDemand: PeriodDemandWithoutUser;
};

export type SwapWithUsers = SwapShifts & {
  requester: User;
  reciever: User;
  recieverShift: UserSchedulePeriod;
  requesterShift: UserSchedulePeriod;
};

export type SwapResponse = {
  message: string;
  id: string;
  status: STATUS;
  offeredShift: UserWithPeriodDemand;
  requestedShift: UserWithPeriodDemand;
};

export type UserWithPeriodDemand = {
  user: UserSchema;
  shift: PeriodDemandWithoutUser;
};
