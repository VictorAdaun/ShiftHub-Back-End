import { Inject, Service } from "typedi";
import {
  EmployeeTaskRepository,
  TaskListRepository,
  TaskRepository,
} from "../../task/repository/TaskRepository";
import { Task } from "@prisma/client";
import { AuthRepository } from "../../user/repository/AuthRepository";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../../core/errors/errors";
import {
  CollaboratorTask,
  EmployeeTaskDetails,
} from "../../task/types/TaskTypes";
import { CompanyRepository } from "../../user/repository/CompanyRepository";
import { ScheduleRepository } from "../../schedule/repository/ScheduleRepository";
import moment from "moment";
import {
  CompanyScheduleDetails,
  CreateScheduleData,
  FullUserScheduleDetails,
  PeriodDemandWithoutUser,
  UserAvailability,
  UserShiftDetails,
} from "../../schedule/types/ScheduleTypes";
import { formatDate, getHourDifference } from "../../../utils/formatDate";
import { PaginationResponse, paginate } from "../../../utils/request";
import { week } from "../../schedule/services/ScheduleService";

@Service()
export class EmployeeService {
  @Inject()
  private taskRepo: TaskRepository;

  @Inject()
  private authRepo: AuthRepository;

  @Inject()
  private companyRepo: CompanyRepository;

  @Inject()
  private listRepo: TaskListRepository;

  @Inject()
  private employeeTaskRepo: EmployeeTaskRepository;

  @Inject()
  private scheduleRepo: ScheduleRepository;

  async getUserTasks(
    userId: string,
    limit?: number,
    page?: number
  ): Promise<PaginationResponse> {
    limit = limit ? limit : 10;
    page = page ? page : 1;
    const skip = page ? (page - 1) * limit : 1 * limit;

    const employeeTask = await this.employeeTaskRepo.findByUserId(
      userId,
      limit,
      skip
    );
    let returnSchema: EmployeeTaskDetails[] = [];
    let total = 0;

    if (employeeTask) {
      total = employeeTask.length;
      const filtered = employeeTask.filter(
        (taskDetails: CollaboratorTask) => !taskDetails.task.isDraft
      );

      returnSchema = filtered.map((taskDetails: CollaboratorTask) =>
        individualTaskSchema(taskDetails.task)
      );
    }

    return {
      message: "Tasks retrieved successfully",
      data: paginate(returnSchema, page, limit, total),
    };
  }

  async getUpcomingShifts(
    userId: string,
    limit?: number,
    page?: number
  ): Promise<PaginationResponse> {
    const year = moment().year();
    const week = moment().week();

    limit = limit ? limit : 10;
    page = page ? page : 1;
    const skip = page ? (page - 1) * limit : 1 * limit;

    const userShifts = await this.scheduleRepo.findUpcomingUserSchedule(
      userId,
      week,
      year,
      limit,
      skip
    );
    let returnSchema: UserShiftDetails[] = [];
    let total = 0;

    if (userShifts) {
      total = userShifts.length;
      returnSchema = userShifts.map((shiftDetails: FullUserScheduleDetails) =>
        userScheduleSchema(shiftDetails)
      );
    }

    return {
      message: "Shifts retrieved successfully",
      data: paginate(returnSchema, page, limit, total),
    };
  }

  async getAvailableSchedules(
    userId: string,
    limit?: number,
    page?: number
  ): Promise<PaginationResponse> {
    const user = await this.authRepo.findUserByIdOrThrow(userId);

    limit = limit ? limit : 10;
    page = page ? page : 1;
    const skip = page ? (page - 1) * limit : 1 * limit;

    const availableSchedules = await this.scheduleRepo.getAllCompanySchedule(
      user.companyId,
      limit,
      skip
    );
    let returnSchema: CreateScheduleData[] = [];
    let total = 0;

    if (availableSchedules) {
      total = availableSchedules.length;
      availableSchedules.map(async (shiftDetails: CompanyScheduleDetails) => {
        returnSchema.push(await this.formatScheduleWithoutUser(shiftDetails));
      });
    }

    return {
      message: "Schedules retrieved successfully",
      data: paginate(returnSchema, page, limit, total),
    };
  }

  async getSchedulePeriodDemand(
    userId: string,
    schedulePeriodDemandId: string
  ): Promise<any> {
    const user = await this.authRepo.findUserByIdOrThrow(userId);

    const schedulePeriodDemand =
      await this.scheduleRepo.findSchedulePeriodDemandById(
        schedulePeriodDemandId
      );

    if (!schedulePeriodDemand) {
      throw new NotFoundError(
        "Schedule not found. Kindly contact your ogranization"
      );
    }

    const year = moment().year();
    const week = moment().week();

    let users = await this.scheduleRepo.findUsersBySchedulePeriodDemandId(
      schedulePeriodDemand.id
    );
    let usersAvailable: UserAvailability[] = [];
    if (users) {
      users = users.filter((user) => user.week == week && user.year == year);
      for (const user of users) {
        usersAvailable.push({
          userId: user.id,
          avatar: user.user.avatar,
          fullName: user.user.fullName,
          email: user.user.email,
        });
      }
    }

    return {
      message: "Schedule period demand retrieved successfully",
      id: schedulePeriodDemand.id,
      day: schedulePeriodDemand.weekDay,
      timeFrame: schedulePeriodDemand.timeFrame,
      startTime: schedulePeriodDemand.startTime,
      endTime: schedulePeriodDemand.endTime,
      neededWorkers: schedulePeriodDemand.workerQuantity,
      availableWorkers: usersAvailable.length,
      status:
        usersAvailable.length < schedulePeriodDemand.workerQuantity
          ? "Available"
          : "Booked",
      workers: usersAvailable,
    };
  }

  async joinShift(
    userId: string,
    schedulePeriodId: string,
    week: string,
    year: string
  ): Promise<any> {
    const user = await this.authRepo.findUserByIdOrThrow(userId);
    const schedule = await this.scheduleRepo.findSchedulePeriodDemandById(
      schedulePeriodId
    );

    if (
      !schedule ||
      !schedule.schedulePeriod.published ||
      user.companyId !== schedule.schedulePeriod.companyId
    ) {
      throw new NotFoundError("Schedule not found");
    }

    let userSchedule = schedule.userSchedulePeriod.map(
      (user) => user.userId == userId
    );
    if (userSchedule.length)
      throw new ConflictError("You are already booked for this shift");

    const quantity = schedule.workerQuantity;
    if (schedule.userSchedulePeriod.length >= quantity) {
      throw new BadRequestError("Shift is fully booked");
    }

    let accurateWeek = week ? parseInt(week) : moment().week();
    let accurateYear = year ? parseInt(year) : moment().year();

    if (moment().year() > accurateYear) {
      throw new BadRequestError("Cannot book a schedule for past date");
    }

    if (moment().week() > accurateWeek) {
      throw new BadRequestError("Cannot book a schedule for past date");
    }

    const { startTime, weekDay } = schedule;
    const requestedDate = formatDate(
      startTime,
      accurateYear,
      accurateWeek,
      weekDay
    );

    if (new Date() > requestedDate) {
      throw new BadRequestError("Cannot book a schedule for past date");
    }

    // const hoursDifference = getHourDifference(new Date(), requestedDate)

    // if (schedule.schedulePeriod.maxHoursBefore > hoursDifference || schedule) {
    // }

    // if (2 + 2 == 4) {
    //   throw new BadRequestError('Shift is fully booked')
    // }

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
      week: accurateWeek,
      year: accurateYear,
    });

    return this.getUpcomingShifts(userId);
  }

  async formatScheduleWithoutUser(
    schedule: CompanyScheduleDetails
  ): Promise<CreateScheduleData> {
    let periodDemand: PeriodDemandWithoutUser[] = [];

    await Promise.all(
      schedule.schedulePeriodDemand.map(async (demand) => {
        periodDemand.push({
          id: demand.id,
          day: demand.weekDay,
          timeFrame: demand.timeFrame,
          startTime: demand.startTime,
          endTime: demand.endTime,
          neededWorkers: demand.workerQuantity,
        });
      })
    );

    periodDemand.sort(function sortByDay(a, b) {
      let day1 = a.day;
      let day2 = b.day;
      return week[day1] - week[day2];
    });

    return {
      id: schedule.id,
      title: schedule.periodName,
      isPublished: schedule.published,
      repeat: schedule.repeat,
      data: periodDemand,
    };
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
  };
}

function individualTaskSchema(task: Task): EmployeeTaskDetails {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    ownerId: task.userId,
    endDate: task.endDate ? task.endDate : null,
    startDate: task.startDate ? task.startDate : null,
    status: task.status,
    priority: task.priority,
  };
}
