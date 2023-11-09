import { TIME_OFF_REQUEST } from "@prisma/client";

export type Request = {
  id: string;
  type: TIME_OFF_REQUEST | null;
  status: string;
  startDate: Date;
  endDate: Date;
  timeFrame: string;
  reason: string | null | undefined;
};
