import {
  Prisma,
  SchedulePeriod,
  SchedulePeriodDemand,
  UserSchedulePeriod,
} from '@prisma/client'
import { Service } from 'typedi'
import { prisma } from '../../../prismaClient'
import {
  FullScheduleDetails,
  FullUserDemand,
  FullUserScheduleDetails,
  ScheduleDemandAndUsers,
} from '../types/ScheduleTypes'

@Service()
export class ScheduleRepository {
  async createSchedulePeriod(
    scheduleDetails: Prisma.SchedulePeriodCreateInput
  ): Promise<SchedulePeriod> {
    return await prisma.schedulePeriod.create({
      data: scheduleDetails,
    })
  }

  async createSchedulePeriodDemand(
    scheduleDemandDetails: Prisma.SchedulePeriodDemandCreateInput
  ): Promise<SchedulePeriodDemand> {
    return await prisma.schedulePeriodDemand.create({
      data: scheduleDemandDetails,
    })
  }

  async createUserSchedule(
    userScheduleDetails: Prisma.UserSchedulePeriodCreateInput
  ): Promise<UserSchedulePeriod> {
    return await prisma.userSchedulePeriod.create({
      data: userScheduleDetails,
    })
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
    })
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
    })
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
    })
  }

  async findAllUserSchedule(
    userId: string
  ): Promise<UserSchedulePeriod[] | null> {
    return await prisma.userSchedulePeriod.findMany({
      where: {
        AND: [{ userId }, { deletedAt: null }],
      },
    })
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
    })
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
    })
  }
}
