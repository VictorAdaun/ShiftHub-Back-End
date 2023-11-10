import { Inject, Service } from "typedi";
import {
  EmployeeTaskRepository,
  TaskListRepository,
  TaskRepository,
} from "../../task/repository/TaskRepository";
import {
  SchedulePeriodDemand,
  SwapShifts,
  Task,
  TimeOff,
  UserSchedulePeriod,
} from "@prisma/client";
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
  UserScheduleDemandWithUser,
  UserShiftDetails,
} from "../../schedule/types/ScheduleTypes";
import {
  calculateIfValid,
  formatDate,
  getDayDifference,
  getHourDifference,
} from "../../../utils/formatDate";
import { PaginationResponse, paginate } from "../../../utils/request";
import { week } from "../../schedule/services/ScheduleService";
import { EditTimeOffRequest, TimeOffRequest } from "../types/EmployeeRequest";
import { TimeOffRepository } from "../repository/TimeOffRepository";
import {
  EmployeeShift,
  Request,
  SwapResponse,
  SwapWithUsers,
  TimeOffUser,
} from "../types/EmployeeTypes";
import { schemaToUser } from "../../admin/services/AdminService";
import { scheduler } from "timers/promises";
import { resetPasswordResponse } from "../../user/types/AuthTypes";
import { ShiftSwapRepository } from "../repository/ShiftSwapRepository";
import { NotficationService } from "./NotificationService";

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

  @Inject()
  private shiftSwapRepo: ShiftSwapRepository;

  @Inject()
  private notificationsService: NotficationService;

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

    const total = availableSchedules.length;

    let returnSchema: any[] = [];
    for (const shiftDetails of availableSchedules) {
      returnSchema.push(await this.formatScheduleWithoutUser(shiftDetails));
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

  async getAvailableSwaps(
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

    const year = moment().year();
    const week = moment().week();

    const availableSchedules =
      await this.scheduleRepo.getAllUpcomingCompanyShifts(
        companyId,
        week,
        year,
        limit,
        skip
      );

    const filterUser = availableSchedules.filter(
      (schedule) => schedule.userId !== userId
    );

    const data = availableSchedules.map((schedule) =>
      userCompanyShifts(schedule)
    );

    return {
      message: "Avaialble shifts fetched successfully",
      data: paginate(data, page, limit, data.length),
    };
  }

  async requestSwap(
    userId: string,
    companyId: string,
    ownerPeriodId: string,
    userPeriodId: string
  ): Promise<resetPasswordResponse> {
    const user = await this.authRepo.findUserByIdOrThrow(userId);

    if (user.companyId !== companyId) {
      throw new BadRequestError("User company mismatch");
    }

    const ownSchedule = await this.scheduleRepo.findUserSchedulePeriodById(
      ownerPeriodId
    );
    if (!ownSchedule) {
      throw new NotFoundError("Own schedule doesn't exist");
    }

    if (ownSchedule.userId !== userId) {
      throw new BadRequestError(
        "You are not authorized to perform this action"
      );
    }

    const userSchedule = await this.scheduleRepo.findUserSchedulePeriodById(
      userPeriodId
    );
    if (!userSchedule) {
      throw new NotFoundError("Requested schedule doesn't exist");
    }

    if (userSchedule.userId == userId) {
      throw new BadRequestError("You cannot swap your own schedule");
    }

    const checkIfExists = await this.shiftSwapRepo.findBothIds(
      ownerPeriodId,
      userPeriodId
    );
    if (checkIfExists) {
      throw new BadRequestError(
        "A request has already been created for these two shifts"
      );
    }

    const ownSchedulePeriodDemand =
      await this.scheduleRepo.findSchedulePeriodDemandById(
        ownSchedule.schedulePeriodDemandId
      );
    if (!ownSchedulePeriodDemand) {
      throw new NotFoundError("Own schedule period doesn't exist");
    }

    calculateIfValid(
      ownSchedulePeriodDemand.startTime,
      ownSchedule.year,
      ownSchedule.week,
      ownSchedulePeriodDemand.weekDay
    );

    const schedulePeriodDemand =
      await this.scheduleRepo.findSchedulePeriodDemandById(
        userSchedule.schedulePeriodDemandId
      );
    if (!schedulePeriodDemand) {
      throw new NotFoundError("Requested schedule period doesn't exist");
    }

    if (
      schedulePeriodDemand.userSchedulePeriod.find((user) => user.id == userId)
    ) {
      throw new BadRequestError(
        "You cannot swap a schedule you are booked for"
      );
    }

    calculateIfValid(
      schedulePeriodDemand.startTime,
      userSchedule.year,
      userSchedule.week,
      schedulePeriodDemand.weekDay
    );

    const swap = await this.shiftSwapRepo.createSwap({
      reciever: {
        connect: {
          //person we are making request to
          id: userSchedule.userId,
        },
      },
      requester: {
        connect: {
          //person initiating swap
          id: userId,
        },
      },
      recieverShift: {
        connect: {
          //shift we are trying to get
          id: userPeriodId,
        },
      },
      requesterShift: {
        connect: {
          //shift of the person swapping
          id: ownerPeriodId,
        },
      },
      company: {
        connect: {
          id: companyId,
        },
      },
    });

    await this.notificationsService.requestShiftSwap(swap.id);

    return {
      message: "Swap request sent successfully",
    };
  }

  async acceptOrRejectSwap(
    userId: string,
    companyId: string,
    swapId: string,
    userStatus: boolean
  ): Promise<SwapResponse> {
    const user = await this.authRepo.findUserByIdOrThrow(userId);

    if (user.companyId !== companyId) {
      throw new BadRequestError("User company mismatch");
    }

    const swap = await this.shiftSwapRepo.findById(swapId);
    if (!swap) {
      throw new NotFoundError("No swap record found");
    }

    if (swap.companyId !== companyId) {
      throw new BadRequestError("No swap record found");
    }

    if (swap.recieverId !== userId) {
      throw new BadRequestError(
        "You do not have the permssions to perform this action"
      );
    }

    if (swap.status !== "PENDING") {
      throw new BadRequestError(
        "You are currently unable to change the status of this swap"
      );
    }

    await this.shiftSwapRepo.updateOne(swap.id, {
      status: userStatus ? "APPROVED" : "DENIED",
    });

    if (userStatus) {
      await this.scheduleRepo.updateUserSchedulePeriod(swap.requesterShiftId, {
        deletedAt: new Date(),
      });

      await this.scheduleRepo.updateUserSchedulePeriod(swap.requesterId, {
        deletedAt: new Date(),
      });

      await this.scheduleRepo.createUserSchedule({
        user: {
          connect: {
            id: swap.requesterId,
          },
        },
        company: {
          connect: {
            id: swap.companyId,
          },
        },
        week: swap.recieverShift.week,
        year: swap.recieverShift.year,
        schedulePeriod: {
          connect: {
            id: swap.recieverShift.schedulePeriodId,
          },
        },
        schedulePeriodDemand: {
          connect: {
            id: swap.recieverShift.schedulePeriodDemandId,
          },
        },
      });
    }

    await this.scheduleRepo.createUserSchedule({
      user: {
        connect: {
          id: swap.recieverId,
        },
      },
      company: {
        connect: {
          id: swap.companyId,
        },
      },
      week: swap.requesterShift.week,
      year: swap.requesterShift.year,
      schedulePeriod: {
        connect: {
          id: swap.requesterShift.schedulePeriodId,
        },
      },
      schedulePeriodDemand: {
        connect: {
          id: swap.requesterShift.schedulePeriodDemandId,
        },
      },
    });

    await this.notificationsService.respondShiftSwap(swap.id);

    return await this.viewSwapDetails(userId, companyId, swap.id);
  }

  async viewSwapDetails(
    userId: string,
    companyId: string,
    swapId: string
  ): Promise<SwapResponse> {
    const user = await this.authRepo.findUserByIdOrThrow(userId);

    if (user.companyId !== companyId) {
      throw new BadRequestError("User company mismatch");
    }

    const swap = await this.shiftSwapRepo.findById(swapId);
    if (!swap) {
      throw new NotFoundError("No swap record found");
    }

    if (swap.companyId !== companyId) {
      throw new BadRequestError("No swap record found");
    }

    if (user.userType !== "ADMIN") {
      if (swap.recieverId !== userId || swap.requesterId !== userId) {
        throw new BadRequestError(
          "You do not have the permssions to perform this action"
        );
      }
    }

    return await this.userSchedulePeriodSchema(swap);
  }

  async getUserSwaps(
    userId: string,
    companyId: string,
    limit?: number,
    page?: number,
    status?: string
  ): Promise<PaginationResponse> {
    const user = await this.authRepo.findUserByIdOrThrow(userId);

    if (user.companyId !== companyId) {
      throw new BadRequestError("User company mismatch");
    }

    limit = limit ? limit : 10;
    page = page ? page : 1;
    status = status ? status : "sent";
    const skip = page ? (page - 1) * limit : 1 * limit;

    let data: any[] = [];

    const swaps =
      status == "sent"
        ? await this.shiftSwapRepo.findUserSentSwaps(userId, limit, skip)
        : await this.shiftSwapRepo.findUserRecievedSwaps(userId, limit, skip);

    for (const swap of swaps) {
      data.push(await this.userSchedulePeriodSchema(swap));
    }
    return {
      message: "Swaps fetched successfully",
      data: paginate(swaps, page, limit, swaps.length),
    };
  }

  async formatScheduleWithoutUser(
    schedule: CompanyScheduleDetails
  ): Promise<CreateScheduleData> {
    let periodDemand: PeriodDemandWithoutUser[] = [];

    await Promise.all(
      (periodDemand = schedule.schedulePeriodDemand.map((demand) =>
        periodDemandSchema(demand)
      ))
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

  async userSchedulePeriodSchema(swap: SwapWithUsers): Promise<SwapResponse> {
    const offeredDemand = await this.scheduleRepo.findSchedulePeriodDemandById(
      swap.requesterShift.schedulePeriodDemandId
    );
    if (!offeredDemand) {
      console.log("Not found");
      throw new NotFoundError("Schedule not found");
    }

    const requestedDemand =
      await this.scheduleRepo.findSchedulePeriodDemandById(
        swap.recieverShift.schedulePeriodDemandId
      );
    if (!requestedDemand) {
      console.log("Not found");
      throw new NotFoundError("Schedule not found");
    }

    return {
      message: "Swap details fetched successfully",
      id: swap.id,
      status: swap.status,
      offeredShift: {
        user: schemaToUser(swap.requester),
        shift: periodDemandSchema(offeredDemand),
      },
      requestedShift: {
        user: schemaToUser(swap.reciever),
        shift: periodDemandSchema(requestedDemand),
      },
    };
  }
}

export function timeOffRequestWithUser(request: TimeOffUser): Request {
  let user: any = {};
  if (request.user) user = schemaToUser(request.user);
  return {
    id: request.id,
    type: request.type,
    status: request.status,
    startDate: request.startDate,
    endDate: request.endDate,
    timeFrame: request.timeFrame,
    reason: request.reason,
    user,
  };
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

function userCompanyShifts(shift: UserScheduleDemandWithUser): EmployeeShift {
  return {
    userScheduleId: shift.id,
    user: schemaToUser(shift.user),
    periodDemand: periodDemandSchema(shift.schedulePeriodDemand),
  };
}

function periodDemandSchema(
  demand: SchedulePeriodDemand
): PeriodDemandWithoutUser {
  return {
    id: demand.id,
    day: demand.weekDay,
    timeFrame: demand.timeFrame,
    startTime: demand.startTime,
    endTime: demand.endTime,
    neededWorkers: demand.workerQuantity,
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
    userPeriodId: userSchedule.id,
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
