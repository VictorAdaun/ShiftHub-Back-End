import { Inject, Service } from 'typedi'
import {
  EmployeeTaskRepository,
  TaskListRepository,
  TaskRepository,
} from '../../task/repository/TaskRepository'
import { Task } from '@prisma/client'
import { AuthRepository } from '../../user/repository/AuthRepository'
import { BadRequestError, NotFoundError } from '../../../core/errors/errors'
import {
  CollaboratorTask,
  EmployeeTaskDetails,
  UserTaskResponse,
} from '../../task/types/TaskTypes'
import { CompanyRepository } from '../../user/repository/CompanyRepository'
import { ScheduleRepository } from '../../schedule/repository/ScheduleRepository'
import moment from 'moment'
import {
  FullUserScheduleDetails,
  UserShiftDetails,
  UserShiftResponse,
} from '../../schedule/types/ScheduleTypes'

@Service()
export class EmployeeService {
  @Inject()
  private taskRepo: TaskRepository

  @Inject()
  private authRepo: AuthRepository

  @Inject()
  private companyRepo: CompanyRepository

  @Inject()
  private listRepo: TaskListRepository

  @Inject()
  private employeeTaskRepo: EmployeeTaskRepository

  @Inject()
  private scheduleRepo: ScheduleRepository

  async getUserTasks(
    userId: string,
    limit?: number,
    page?: number
  ): Promise<UserTaskResponse> {
    limit = limit ? limit : 10
    page = page ? page : 1
    const skip = page ? (page - 1) * limit : 1 * limit

    const employeeTask = await this.employeeTaskRepo.findByUserId(
      userId,
      limit,
      skip
    )
    let returnSchema: EmployeeTaskDetails[] = []
    let total = 0

    if (employeeTask) {
      total = employeeTask.length
      returnSchema = employeeTask.map((taskDetails: CollaboratorTask) =>
        individualTaskSchema(taskDetails.task)
      )
    }

    const lastpage = Math.ceil(total / limit)
    const nextpage = page + 1 > lastpage ? null : page + 1
    const prevpage = page - 1 < 1 ? null : page - 1

    return {
      message: 'Tasks retrieved successfully',
      tasks: returnSchema,
      total,
      lastpage,
      nextpage,
      prevpage,
    }
  }

  async getUpcomingShifts(
    userId: string,
    limit?: number,
    page?: number
  ): Promise<UserShiftResponse> {
    const year = moment().year()
    const week = moment().week()

    limit = limit ? limit : 10
    page = page ? page : 1
    const skip = page ? (page - 1) * limit : 1 * limit

    const userShifts = await this.scheduleRepo.findUpcomingUserSchedule(
      userId,
      week,
      year,
      limit,
      skip
    )
    let returnSchema: UserShiftDetails[] = []
    let total = 0

    limit = limit ? limit : 10
    page = page ? page : 1

    if (userShifts) {
      total = userShifts.length
      returnSchema = userShifts.map((shiftDetails: FullUserScheduleDetails) =>
        userScheduleSchema(shiftDetails)
      )
    }

    const lastpage = Math.ceil(total / limit)
    const nextpage = page + 1 > lastpage ? null : page + 1
    const prevpage = page - 1 < 1 ? null : page - 1

    return {
      message: 'Shifts retrieved successfully',
      shifts: returnSchema,
      total,
      lastpage,
      nextpage,
      prevpage,
    }
  }

  async joinShift(
    userId: string,
    schedulePeriodId: string,
    week: string,
    year: string
  ): Promise<any> {
    const user = await this.authRepo.findUserByIdOrThrow(userId)
    const schedule = await this.scheduleRepo.findSchedulePeriodDemandById(
      schedulePeriodId
    )
    if (!schedule || user.companyId !== schedule.schedulePeriod.companyId) {
      throw new NotFoundError('Schedule not found')
    }
    const quantity = schedule.workerQuantity
    if (schedule.userSchedulePeriod.length >= quantity) {
      throw new BadRequestError('Shift is fully booked')
    }

    if (moment().year() > parseInt(year)) {
      throw new BadRequestError('Cannot book a schedule for past date')
    }

    if (moment().week() > parseInt(week)) {
      throw new BadRequestError('Cannot book a schedule for past date')
    }

    await this.scheduleRepo.createUserSchedule({
      user: {
        connect: {
          id: userId,
        },
      },
      schedulePeriod: {
        connect: {
          id: schedule.schedulePeriodId,
        },
      },
      schedulePeriodDemand: {
        connect: {
          id: schedule.id,
        },
      },
      week: parseInt(week),
      year: parseInt(year),
    })

    return this.getUpcomingShifts(userId)
  }
}

function userScheduleSchema(
  userSchedule: FullUserScheduleDetails
): UserShiftDetails {
  return {
    userId: userSchedule.userId,
    week: userSchedule.week,
    year: userSchedule.year,
    weekDay: userSchedule.schedulePeriodDemand.weekDay,
    startTime: userSchedule.schedulePeriodDemand.startTime,
    endTime: userSchedule.schedulePeriodDemand.endTime,
    timeFrame: userSchedule.schedulePeriodDemand.timeFrame,
    periodName: userSchedule.schedulePeriod.periodName,
    periodId: userSchedule.schedulePeriodId,
    periodDemandId: userSchedule.schedulePeriodDemandId,
  }
}

function individualTaskSchema(task: Task): EmployeeTaskDetails {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    ownerId: task.userId,
    dueDate: task.dueDate ? task.dueDate : null,
    status: task.status,
    priority: task.priority,
  }
}
