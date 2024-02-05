import {
  Notifications,
  Prisma,
  STATUS,
  TIME_OFF_REQUEST,
  TimeOff,
} from "@prisma/client";
import { Service } from "typedi";

import { prisma } from "../../../prismaClient";
import { TimeOffUser } from "../types/EmployeeTypes";
import { TimeInput } from "../../team/types/TeamTypes";
import moment from "moment";

@Service()
export class TimeOffRepository {
  async createTimeOffRequest(
    requestDetails: Prisma.TimeOffCreateInput
  ): Promise<TimeOff> {
    return await prisma.timeOff.create({
      data: requestDetails,
    });
  }

  async getUserTimeOffRequests(
    userId: string,
    take: number,
    skip: number
  ): Promise<TimeOff[]> {
    return await prisma.timeOff.findMany({
      where: {
        user: {
          id: userId,
        },
      },
      take,
      skip,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getAllTimeOffRequests(
    companyId: string,
    status: STATUS,
    take: number,
    skip: number
  ): Promise<TimeOffUser[]> {
    return await prisma.timeOff.findMany({
      where: {
        company: {
          id: companyId,
        },
        status,
      },
      include: {
        user: true,
      },
      take,
      skip,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getUserTimeOffRequestByStatus(
    userId: string,
    status: STATUS
  ): Promise<TimeOff[]> {
    return await prisma.timeOff.findMany({
      where: {
        AND: [
          {
            user: {
              id: userId,
            },
          },
          { status },
        ],
      },
    });
  }

  async findMany(query: Prisma.TimeOffFindManyArgs): Promise<TimeOff[]> {
    return await prisma.timeOff.findMany(query);
  }

  async findOne(query: Prisma.TimeOffFindFirstArgs): Promise<TimeOff | null> {
    return await prisma.timeOff.findFirst(query);
  }

  async findById(id: string): Promise<TimeOff | null> {
    return await prisma.timeOff.findFirst({
      where: {
        id,
      },
    });
  }

  async getAllTimeOffRequestsTimeBased(
    companyId: string,
    dateQuery: TimeInput
  ): Promise<number> {
    return await prisma.timeOff.count({
      where: {
        company: {
          id: companyId,
        },
        createdAt: {
          gte: moment(dateQuery.startDate).toDate(),
          lte: moment(dateQuery.endDate).toDate(),
        }
      },
    });
  }

  async getAllApprovedTimeOffTimeBased(
    companyId: string,
    dateQuery: TimeInput
  ): Promise<TimeOff[]> {
    return await prisma.timeOff.findMany({
      where: {
        company: {
          id: companyId,
        },
        status: 'APPROVED',
        createdAt: {
          gte: moment(dateQuery.startDate).toDate(),
          lte: moment(dateQuery.endDate).toDate(),
        }
      },
    });
  }


  async updateOne(
    id: string,
    query: Prisma.TimeOffUpdateInput
  ): Promise<TimeOff | null> {
    return await prisma.timeOff.update({
      where: { id },
      data: query,
    });
  }
}
