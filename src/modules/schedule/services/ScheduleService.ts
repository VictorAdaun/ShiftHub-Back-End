import { Inject, Service } from "typedi";
import { AuthRepository } from "../../user/repository/AuthRepository";
import { CompanyRepository } from "../../user/repository/CompanyRepository";
import { ScheduleRepository } from "../repository/ScheduleRepository";
import { BadRequestError, NotFoundError } from "../../../core/errors/errors";
import {
  CreateScheduleRequest,
  ViewScheduleRequest,
} from "../types/ScheduleRequest";
import {
  CompanyScheduleDetails,
  CreateScheduleData,
  CreateScheduleResponse,
  FullScheduleDetails,
  PeriodDemand,
  PeriodDemandWithoutUser,
  ShortCompanySchedule,
  UserAvailability,
} from "../types/ScheduleTypes";
import moment from "moment";
import { PaginationResponse, paginate } from "../../../utils/request";

@Service()
export class ScheduleService {
  @Inject()
  private scheduleRepo: ScheduleRepository;

  @Inject()
  private userRepo: AuthRepository;

  @Inject()
  private companyRepo: CompanyRepository;

  async createSchedule(
    body: CreateScheduleRequest,
    userId: string,
    companyId: string
  ): Promise<PaginationResponse> {
    const user = await this.userRepo.findUserByIdOrThrow(userId);
    const company = await this.companyRepo.findCompanyById(companyId);

    if (!user || !company) {
      throw new NotFoundError("Invalid credentials");
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
    });

    body.availability.map(async (items) => {
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
          startTime: data.startTime,
          endTime: data.endTime,
        });
      }
    });

    const query = {
      week: moment().week(),
      year: moment().year(),
    };

    return await this.getAllAdminSchedules(userId, companyId);
  }

  async getAllEmployeeSchedules(
    userId: string,
    companyId: string,
    limit?: number,
    page?: number
  ): Promise<PaginationResponse> {
    const user = await this.userRepo.findUserByIdOrThrow(userId);
    const company = await this.companyRepo.findCompanyById(companyId);

    if (!user || !company) {
      throw new NotFoundError("Invalid credentials");
    }

    limit = limit ? limit : 10;
    page = page ? page : 1;
    const skip = page ? (page - 1) * limit : 1 * limit;

    const schedules = await this.scheduleRepo.getAllCompanySchedule(
      companyId,
      limit,
      skip
    );

    const total = schedules.length;

    let returnSchema = schedules.map((schedule) => shortSchedule(schedule));

    return {
      message: "Schedules retrieved successfully",
      data: paginate(returnSchema, page, limit, total),
    };
  }

  async getAllAdminSchedules(
    userId: string,
    companyId: string,
    limit?: number,
    page?: number
  ): Promise<PaginationResponse> {
    const user = await this.userRepo.findUserByIdOrThrow(userId);
    const company = await this.companyRepo.findCompanyById(companyId);

    if (!user || !company) {
      throw new NotFoundError("Invalid credentials");
    }

    limit = limit ? limit : 10;
    page = page ? page : 1;
    const skip = page ? (page - 1) * limit : 1 * limit;

    const schedules = await this.scheduleRepo.getAllAdminCompanySchedule(
      companyId,
      limit,
      skip
    );

    const total = schedules.length;

    let returnSchema = schedules.map((schedule) => shortSchedule(schedule));

    return {
      message: "Schedules retrieved successfully",
      data: paginate(returnSchema, page, limit, total),
    };
  }

  async publishSchedule(
    userId: string,
    companyId: string,
    status: boolean,
    scheduleId: string
  ): Promise<PaginationResponse> {
    const user = await this.userRepo.findUserByIdOrThrow(userId);
    const company = await this.companyRepo.findCompanyById(companyId);

    if (!user || !company) {
      throw new NotFoundError("Invalid credentials");
    }

    const schedule = await this.scheduleRepo.findSchedulePeriodById(scheduleId);
    if (!schedule) {
      throw new NotFoundError("Schedule not found");
    }

    if (schedule.published == status) {
      throw new BadRequestError("Status is same");
    }

    if (status) {
      const findPublished = await this.scheduleRepo.getCompanyPublishedSchedule(
        companyId
      );
      if (findPublished) {
        await this.scheduleRepo.updateSchedulePeriod(findPublished.id, {
          published: false,
        });
      }
    }

    await this.scheduleRepo.updateSchedulePeriod(schedule.id, {
      published: status,
    });

    return await this.getAllAdminSchedules(userId, companyId);
  }

  async deleteSchedule(
    userId: string,
    companyId: string,
    scheduleId: string
  ): Promise<PaginationResponse> {
    const user = await this.userRepo.findUserByIdOrThrow(userId);
    const company = await this.companyRepo.findCompanyById(companyId);

    if (!user || !company) {
      throw new NotFoundError("Invalid credentials");
    }

    const schedule = await this.scheduleRepo.findSchedulePeriodById(scheduleId);
    if (!schedule || schedule.companyId !== companyId) {
      throw new NotFoundError("Schedule not found");
    }

    await this.scheduleRepo.updateSchedulePeriod(schedule.id, {
      deletedAt: new Date(),
    });

    return await this.getAllAdminSchedules(userId, companyId);
  }

  async getScheduleDetails(
    scheduleId: string,
    userId: string,
    companyId: string,
    body: ViewScheduleRequest
  ): Promise<CreateScheduleResponse> {
    const user = await this.userRepo.findUserByIdOrThrow(userId);
    const company = await this.companyRepo.findCompanyById(companyId);

    if (!user || !company) {
      throw new NotFoundError("Invalid credentials");
    }

    return {
      message: "Schedule retrieved successfully",
      data: await this.getSchedule(scheduleId, body),
    };
  }

  async getSchedule(
    scheduleId: string,
    query: ViewScheduleRequest
  ): Promise<CreateScheduleData> {
    const schedule = await this.scheduleRepo.findSchedulePeriodById(scheduleId);
    if (!schedule) {
      throw new NotFoundError("Schedule not found");
    }

    if (query.year < moment(schedule.createdAt).year()) {
      query.year = moment(schedule.createdAt).year();
      query.week = moment(schedule.createdAt).week();
    }
    return await this.formatSchedule(schedule, query);
  }

  private async formatSchedule(
    schedule: FullScheduleDetails,
    query: ViewScheduleRequest
  ): Promise<CreateScheduleData> {
    let periodDemand: PeriodDemand[] = [];

    await Promise.all(
      schedule.schedulePeriodDemand.map(async (demand) => {
        let users = await this.scheduleRepo.findUsersBySchedulePeriodDemandId(
          demand.id
        );
        let usersAvailable: UserAvailability[] = [];
        if (users) {
          users = users.filter(
            (user) => user.week == query.week && user.year == query.year
          );
          for (const user of users) {
            usersAvailable.push({
              userId: user.id,
              avatar: user.user.avatar,
              fullName: user.user.fullName,
              email: user.user.email,
            });
          }
        }

        periodDemand.push({
          id: demand.id,
          day: demand.weekDay,
          timeFrame: demand.timeFrame,
          startTime: demand.startTime,
          endTime: demand.endTime,
          neededWorkers: demand.workerQuantity,
          availableWorkers: usersAvailable.length,
          status:
            usersAvailable.length < demand.workerQuantity
              ? "Available"
              : "Booked",
          workers: usersAvailable,
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

function shortSchedule(schedule: CompanyScheduleDetails): ShortCompanySchedule {
  return {
    id: schedule.id,
    title: schedule.periodName,
    repeat: schedule.repeat,
    isPublished: schedule.published,
  };
}

export const week = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};
