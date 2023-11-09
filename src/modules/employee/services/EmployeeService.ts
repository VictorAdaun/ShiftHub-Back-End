import { Inject, Service } from "typedi";
import {
  EmployeeTaskRepository,
  TaskListRepository,
  TaskRepository,
} from "../../task/repository/TaskRepository";
import { Task, TimeOff } from "@prisma/client";
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
  PeriodDemand,
  PeriodDemandResponse,
  PeriodDemandWithoutUser,
  UserAvailability,
  UserShiftDetails,
} from "../../schedule/types/ScheduleTypes";
import {
  formatDate,
  getDayDifference,
  getHourDifference,
} from "../../../utils/formatDate";
import { PaginationResponse, paginate } from "../../../utils/request";
import { week } from "../../schedule/services/ScheduleService";
import { EditTimeOffRequest, TimeOffRequest } from "../types/EmployeeRequest";
import { TimeOffRepository } from "../repository/TimeOffRepository";
import { Request } from "../types/EmployeeTypes";

@Service()
export class EmployeeService {
  @Inject()
  private taskRepo: TaskRepository;

  @Inject()
  private authRepo: AuthRepository;

  @Inject()
  private companyRepo: CompanyRepository;

  @Inject()
  private timeOffRepo: TimeOffRepository;

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
  ): Promise<PeriodDemandResponse> {
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
  ): Promise<PaginationResponse> {
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

    await this.scheduleRepo.createUserSchedule({
      user: {
        connect: {
          id: userId,
        },
      },
      company: {
        connect: {
          id: user.companyId,
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

  async requestTimeOff(
    userId: string,
    companyId: string,
    body: TimeOffRequest
  ): Promise<PaginationResponse> {
    const user = await this.authRepo.findUserByIdOrThrow(userId);

    if (user.companyId !== companyId) {
      throw new BadRequestError("User company mismatch");
    }

    if (new Date() > body.startDate) {
      throw new BadRequestError("Cannot select past date");
    }

    if (new Date() > body.endDate) {
      throw new BadRequestError("Cannot select past date");
    }

    if (body.endDate <= body.startDate) {
      throw new BadRequestError("End date must be past start date");
    }

    const endDate = body.endDate;
    const startDate = body.startDate;

    const { days, hour } = getDayDifference(startDate, endDate);

    const statement = `${days} day(s), ${hour} hour(s)`;

    await this.timeOffRepo.createTimeOffRequest({
      user: {
        connect: {
          id: userId,
        },
      },
      company: {
        connect: {
          id: companyId,
        },
      },
      type: body.type,
      reason: body.reason ? body.reason : null,
      timeFrame: statement,
      startDate,
      endDate,
    });

    return await this.getAllUserTimeOffReuests(userId, companyId);
  }

  async getAllUserTimeOffReuests(
    userId: string,
    companyId: string,
    limit?: number,
    page?: number
  ): Promise<PaginationResponse> {
    const user = await this.authRepo.findUserByIdOrThrow(userId);

    if (user.companyId !== companyId) {
      throw new BadRequestError("User company mismatch");
    }

    limit = limit ? limit : 10;
    page = page ? page : 1;
    const skip = page ? (page - 1) * limit : 1 * limit;

    const allRequests = await this.timeOffRepo.getUserTimeOffRequests(
      userId,
      limit,
      skip
    );

    const data = allRequests.map((request) => timeOffRequest(request));

    return {
      message: "User requests fetched successfully",
      data: paginate(data, page, limit, data.length),
    };
  }

  async updateUserRequest(
    userId: string,
    companyId: string,
    requestId: string,
    body: EditTimeOffRequest
  ): Promise<PaginationResponse> {
    const user = await this.authRepo.findUserByIdOrThrow(userId);

    if (user.companyId !== companyId) {
      throw new BadRequestError("User company mismatch");
    }

    const request = await this.timeOffRepo.findOne({
      where: {
        id: requestId,
        user: {
          id: userId,
        },
      },
    });

    if (!request) {
      throw new NotFoundError("Request not found");
    }

    if (request.status == "APPROVED") {
      throw new NotFoundError(`Request is already approved`);
    }

    if (request.status == "EXPIRED") {
      throw new NotFoundError("Expired requests cannot be updated");
    }

    if (body.startDate && new Date() > body.startDate) {
      throw new BadRequestError("Cannot select past date");
    }

    if (body.endDate && new Date() > body.endDate) {
      throw new BadRequestError("Cannot select past date");
    }

    const endDate = body.endDate ? body.endDate : request.endDate;
    const startDate = body.startDate ? body.startDate : request.startDate;

    if (endDate <= startDate) {
      throw new BadRequestError("End date must be past start date");
    }

    const { days, hour } = getDayDifference(startDate, endDate);

    const statement = `${days} day(s), ${hour} hour(s)`;

    await this.timeOffRepo.updateOne(request.id, {
      type: body.type ? body.type : request.type,
      reason: body.reason ? body.reason : request.reason,
      timeFrame: statement,
      startDate,
      endDate,
    });

    return await this.getAllUserTimeOffReuests(userId, companyId);
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

export function timeOffRequest(request: TimeOff): Request {
  return {
    id: request.id,
    type: request.type,
    status: request.status,
    startDate: request.startDate,
    endDate: request.endDate,
    timeFrame: request.timeFrame,
    reason: request.reason,
  };
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
