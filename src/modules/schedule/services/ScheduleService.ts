import { Inject, Service } from 'typedi'
import { AuthRepository } from '../../user/repository/AuthRepository'
import { CompanyRepository } from '../../user/repository/CompanyRepository'
import { ScheduleRepository } from '../repository/ScheduleRepository'
import { NotFoundError } from '../../../core/errors/errors'
import { CreateScheduleRequest } from '../types/ScheduleRequest'
import {
  CreateScheduleData,
  CreateScheduleResponse,
  FullScheduleDetails,
  PeriodDemand,
  UserAvailability,
} from '../types/ScheduleTypes'

@Service()
export class ScheduleService {
  @Inject()
  private scheduleRepo: ScheduleRepository

  @Inject()
  private userRepo: AuthRepository

  @Inject()
  private companyRepo: CompanyRepository

  async createSchedule(
    body: CreateScheduleRequest,
    userId: string,
    companyId: string
  ): Promise<CreateScheduleResponse> {
    const user = await this.userRepo.findUserByIdOrThrow(userId)
    const company = await this.companyRepo.findCompanyById(companyId)

    if (!user || !company) {
      throw new NotFoundError('Invalid credentials')
    }

    const schedule = await this.scheduleRepo.createSchedulePeriod({
      periodName: body.title,
      repeat: body.repeat,
      maxHoursAfter: body.maxHoursAfter,
      maxHoursBefore: body.maxHoursBefore,
      user: {
        connect: {
          id: user.id,
        },
      },
      company: {
        connect: {
          id: user.companyId,
        },
      },
    })

    body.availabilty.map(async (items) => {
      for (const data of items.data) {
        await this.scheduleRepo.createSchedulePeriodDemand({
          schedulePeriod: {
            connect: {
              id: schedule.id,
            },
          },
          timeFrame: data.time,
          weekDay: items.day,
          workerQuantity: data.userCount,
          workerCount: 0,
          startTime: new Date(data.startTime).toLocaleTimeString(),
          endTime: new Date(data.endTime).toLocaleTimeString(),
        })
      }
    })

    return {
      message: 'Schedule created successfully',
      data: await this.getSchedule(schedule.id),
    }
  }

  async getScheduleDetails(
    scheduleId: string,
    userId: string,
    companyId: string
  ): Promise<CreateScheduleResponse> {
    const user = await this.userRepo.findUserByIdOrThrow(userId)
    const company = await this.companyRepo.findCompanyById(companyId)

    if (!user || !company) {
      throw new NotFoundError('Invalid credentials')
    }

    return {
      message: 'Schedule retrieved successfully',
      data: await this.getSchedule(scheduleId),
    }
  }

  async getSchedule(scheduleId: string): Promise<CreateScheduleData> {
    const schedule = await this.scheduleRepo.findSchedulePeriodById(scheduleId)
    if (!schedule) {
      throw new NotFoundError('Schedule not found')
    }
    return await this.formatSchedule(schedule)
  }

  private async formatSchedule(
    schedule: FullScheduleDetails
  ): Promise<CreateScheduleData> {
    const periodDemand: PeriodDemand[] = []
    let usersAvailable: UserAvailability[] = []

    schedule.schedulePeriodDemand.map(async (demand) => {
      const users = await this.scheduleRepo.findUsersBySchedulePeriodDemandId(
        demand.id
      )
      if (users) {
        users.map((user) => {
          usersAvailable.push({
            userId: user.id,
            avatar: user.user.avatar,
            fullName: user.user.fullName,
            email: user.user.email,
          })
        })
      }

      periodDemand.push({
        id: demand.id,
        day: demand.weekDay,
        timeFrame: demand.timeFrame,
        startTime: demand.startTime,
        endTime: demand.endTime,
        neededWorkers: demand.workerQuantity,
        availableWorkers: demand.workerCount,
        status:
          demand.workerCount < demand.workerQuantity ? 'Available' : 'Booked',
        workers: usersAvailable,
      })
    })

    return {
      id: schedule.id,
      title: schedule.periodName,
      isPublished: schedule.published,
      repeat: schedule.repeat,
      data: periodDemand,
    }
  }
}
