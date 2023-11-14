import {
  Prisma,
  SchedulePeriod,
  SchedulePeriodDemand,
  UserSchedulePeriod,
} from "@prisma/client";
import { Service } from "typedi";
import { prisma } from "../../../prismaClient";
import {
  CompanyScheduleDetails,
  FullScheduleDetails,
  FullUserDemand,
  FullUserScheduleDetails,
  ScheduleDemandAndUsers,
  UserScheduleDemand,
  UserScheduleDemandWithUser,
} from "../types/ScheduleTypes";

@Service()
export class ScheduleRepository {
  async createSchedulePeriod(
    scheduleDetails: Prisma.SchedulePeriodCreateInput
  ): Promise<SchedulePeriod> {
    return await prisma.schedulePeriod.create({
      data: scheduleDetails,
    });
  }

  async createSchedulePeriodDemand(
    scheduleDemandDetails: Prisma.SchedulePeriodDemandCreateInput
  ): Promise<SchedulePeriodDemand> {
    return await prisma.schedulePeriodDemand.create({
      data: scheduleDemandDetails,
    });
  }

  async createUserSchedule(
    userScheduleDetails: Prisma.UserSchedulePeriodCreateInput
  ): Promise<UserSchedulePeriod> {
    return await prisma.userSchedulePeriod.create({
      data: userScheduleDetails,
    });
  }

  async findSchedulePeriodById(
    id: string
  ): Promise<FullScheduleDetails | null> {
    return await prisma.schedulePeriod.findFirst({
      where: {
        AND: [{ id }, { deletedAt: null }],
      },
      include: {
        schedulePeriodDemand: true,
        schedulePeriodAvailability: true,
        userSchedulePeriod: true,
      },
    });
  }

  async getAllCompanySchedule(
    companyId: string,
    take: number,
    skip: number
  ): Promise<CompanyScheduleDetails[]> {
    return await prisma.schedulePeriod.findMany({
      where: {
        AND: [
          {
            company: {
              id: companyId,
            },
          },
          { published: true },
          { deletedAt: null },
        ],
      },
      include: {
        schedulePeriodDemand: true,
        userSchedulePeriod: true,
      },
      take,
      skip,
    });
  }

  async getAllAdminCompanySchedule(
    companyId: string,
    take: number,
    skip: number
  ): Promise<CompanyScheduleDetails[]> {
    return await prisma.schedulePeriod.findMany({
      where: {
        AND: [
          {
            company: {
              id: companyId,
            },
          },
          { deletedAt: null },
        ],
      },
      include: {
        schedulePeriodDemand: true,
        userSchedulePeriod: true,
      },
      take,
      skip,
    });
  }

  async getCompanyPublishedSchedule(
    companyId: string
  ): Promise<SchedulePeriod | null> {
    return await prisma.schedulePeriod.findFirst({
      where: {
        AND: [
          {
            company: {
              id: companyId,
            },
          },
          { published: true },
          { deletedAt: null },
        ],
      },
    });
  }

  async updateSchedulePeriod(
    id: string,
    body: Prisma.SchedulePeriodUpdateInput
  ): Promise<SchedulePeriod | null> {
    return await prisma.schedulePeriod.update({
      where: { id },
      data: { ...body },
    });
  }

  async getAllUpcomingCompanyShifts(
    companyId: string,
    week: number,
    year: number,
    take: number,
    skip: number
  ): Promise<UserScheduleDemandWithUser[]> {
    return await prisma.userSchedulePeriod.findMany({
      where: {
        AND: [
          {
            company: {
              id: companyId,
            },
          },
          { deletedAt: null },
          { week: { gte: week } },
          { year: { gte: year } },
        ],
      },
      include: {
        schedulePeriodDemand: true,
        user: true,
      },
      take,
      skip,
    });
  }

  async findSchedulePeriodDemandById(
    id: string
  ): Promise<ScheduleDemandAndUsers | null> {
    return await prisma.schedulePeriodDemand.findFirst({
      where: {
        AND: [{ id }, { deletedAt: null }],
      },
      include: {
        userSchedulePeriod: true,
        schedulePeriod: true,
      },
    });
  }

  async findUserSchedulePeriodById(
    id: string
  ): Promise<UserScheduleDemand | null> {
    return await prisma.userSchedulePeriod.findFirst({
      where: {
        AND: [{ id }, { deletedAt: null }],
      },
      include: {
        schedulePeriodDemand: true,
      },
    });
  }

  async findUsersBySchedulePeriodDemandId(
    scheduleDemandId: string
  ): Promise<FullUserDemand[] | null> {
    return await prisma.userSchedulePeriod.findMany({
      where: {
        AND: [
          { schedulePeriodDemandId: scheduleDemandId },
          { deletedAt: null },
        ],
      },
      include: {
        user: true,
      },
    });
  }

  async findAllUserSchedule(
    userId: string
  ): Promise<UserScheduleDemand[] | null> {
    return await prisma.userSchedulePeriod.findMany({
      where: {
        AND: [{ userId }, { deletedAt: null }],
      },
      include: {
        schedulePeriodDemand: true,
      },
    });
  }

  async countAllSchedules(companyId: string): Promise<number> {
    return await prisma.userSchedulePeriod.count({
      where: {
        AND: [{ companyId }, { deletedAt: null }],
      },
    });
  }

  async findUpcomingUserSchedule(
    userId: string,
    week: number,
    year: number,
    take: number,
    skip: number
  ): Promise<FullUserScheduleDetails[] | null> {
    return await prisma.userSchedulePeriod.findMany({
      where: {
        AND: [
          { userId },
          { deletedAt: null },
          { week: { gte: week } },
          { year: { gte: year } },
        ],
      },
      take,
      skip,
      include: {
        schedulePeriodDemand: true,
        schedulePeriod: true,
      },
    });
  }

  async findUserScheduleInScheduleDemand(
    userId: string,
    scheduleDemandId: string
  ): Promise<UserSchedulePeriod | null> {
    return await prisma.userSchedulePeriod.findFirst({
      where: {
        AND: [
          { userId },
          { schedulePeriodDemandId: scheduleDemandId },
          { deletedAt: null },
        ],
      },
    });
  }

  async updateUserSchedulePeriod(
    id: string,
    body: Prisma.UserSchedulePeriodUpdateInput
  ): Promise<UserSchedulePeriod> {
    return await prisma.userSchedulePeriod.update({
      where: { id },
      data: { ...body },
    });
  }
}
