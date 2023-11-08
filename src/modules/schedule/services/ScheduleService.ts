import { Inject, Service } from "typedi";
import { AuthRepository } from "../../user/repository/AuthRepository";
import { CompanyRepository } from "../../user/repository/CompanyRepository";
import { ScheduleRepository } from "../repository/ScheduleRepository";
import { NotFoundError } from "../../../core/errors/errors";
import {
  CreateScheduleRequest,
  ViewScheduleRequest,
} from "../types/ScheduleRequest";
import {
  CreateScheduleData,
  CreateScheduleResponse,
  FullScheduleDetails,
  PeriodDemand,
  PeriodDemandWithoutUser,
  UserAvailability,
} from "../types/ScheduleTypes";
import moment from "moment";

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
  ): Promise<CreateScheduleResponse> {
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
          startTime: data.startTime,
          endTime: data.endTime,
        });
      }
    });

    const query = {
      week: moment().week(),
      year: moment().year(),
    };

    return {
      message: "Schedule created successfully",
      data: await this.getSchedule(schedule.id, query),
    };
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

export const week = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};
