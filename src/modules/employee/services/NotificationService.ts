import { Inject, Service } from "typedi";
import {
  EmployeeTaskRepository,
  TaskListRepository,
  TaskRepository,
} from "../../task/repository/TaskRepository";
import { NOTIFICATION_TYPE, Task, TimeOff } from "@prisma/client";
import { AuthRepository } from "../../user/repository/AuthRepository";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../../core/errors/errors";
import {
  CollaboratorTask,
  EmployeeTaskDetails,
  EmployeeTaskUserDetails,
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
import { NotificationRepository } from "../repository/NotificationsRepository";

@Service()
export class NotficationService {
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
  private notificationRepo: NotificationRepository;

  async createTask(taskId: string): Promise<void> {
    const task = await this.taskRepo.findTaskById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    await batchNotification(
      task.employeeTask,
      100,
      this.sendCreateTaskNotification
    );
  }

  async sendUpdateTask(taskId: string, userId: string): Promise<void> {
    const task = await this.taskRepo.findTaskById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const triggerUser = await this.authRepo.findUserByIdOrThrow(userId);

    const recievers = task.employeeTask.filter(
      (task) => task.userId !== userId
    );

    for (const user of recievers) {
      await this.notificationRepo.createNotification({
        user: {
          connect: {
            id: user.user.id,
          },
        },
        triggerUser: {
          connect: {
            id: userId,
          },
        },
        tagId: taskId,
        type: NOTIFICATION_TYPE.TASK,
        activity: `${triggerUser.firstName} ${triggerUser.lastName[0]}. updated task ${task.title}`,
      });
    }

    if (task.userId !== userId) {
      await this.notificationRepo.createNotification({
        user: {
          connect: {
            id: task.user.id,
          },
        },
        triggerUser: {
          connect: {
            id: userId,
          },
        },
        tagId: taskId,
        type: NOTIFICATION_TYPE.TASK,
        activity: `${triggerUser.firstName} ${triggerUser.lastName[0]}. updated task ${task.title}`,
      });
    }
  }

  async sendCreateTaskNotification(
    userTask: EmployeeTaskUserDetails
  ): Promise<void> {
    const task = await this.taskRepo.findTaskById(userTask.taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    await this.notificationRepo.createNotification({
      user: {
        connect: {
          id: userTask.user.id,
        },
      },
      triggerUser: {
        connect: {
          id: task.user.id,
        },
      },
      tagId: task.id,
      type: NOTIFICATION_TYPE.TASK,
      activity: `${task.user.firstName} ${task.user.lastName[0]}. assigned you to task ${task.title}`,
    });
  }

  async removeNotification(
    taskId: string,
    userId: string,
    adminId: string
  ): Promise<void> {
    const admin = await this.authRepo.findUserByIdOrThrow(adminId);

    const task = await this.taskRepo.findTaskById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    await this.notificationRepo.createNotification({
      user: {
        connect: {
          id: userId,
        },
      },
      triggerUser: {
        connect: {
          id: adminId,
        },
      },
      tagId: taskId,
      type: NOTIFICATION_TYPE.TASK,
      activity: `${admin.firstName} ${admin.lastName[0]}. removed you from task ${task.title}`,
    });
  }

  async addTaskNotification(
    taskId: string,
    userId: string,
    adminId: string
  ): Promise<void> {
    const admin = await this.authRepo.findUserByIdOrThrow(adminId);

    const task = await this.taskRepo.findTaskById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found");
    }

    await this.notificationRepo.createNotification({
      user: {
        connect: {
          id: userId,
        },
      },
      triggerUser: {
        connect: {
          id: adminId,
        },
      },
      tagId: taskId,
      type: NOTIFICATION_TYPE.TASK,
      activity: `${admin.firstName} ${admin.lastName[0]}. assigned you to task ${task.title}`,
    });
  }

  async timeOffResponse(requestId: string, adminId: string): Promise<void> {
    const admin = await this.authRepo.findUserByIdOrThrow(adminId);

    const request = await this.timeOffRepo.findById(requestId);
    if (!request) {
      throw new NotFoundError("Request not found");
    }

    const answer = request.status == "APPROVED" ? "approved" : "denied";
    await this.notificationRepo.createNotification({
      user: {
        connect: {
          id: request.userId,
        },
      },
      triggerUser: {
        connect: {
          id: adminId,
        },
      },
      tagId: requestId,
      type: NOTIFICATION_TYPE.TIME_OFF,
      activity: `${admin.firstName} ${admin.lastName[0]}. ${answer} your time off request`,
    });
  }
}

export async function batchNotification<T>(
  sub: any[],
  limit: number,
  processFn: (item: T) => Promise<void>
) {
  let results: any[] = [];
  for (let start = 0; start < sub.length; start += limit) {
    const end = start + limit > sub.length ? sub.length : start + limit;

    const slicedResults = await Promise.all(
      sub.slice(start, end).map(processFn)
    );

    results = [...results, ...slicedResults];

    return results;
  }
}

// await batchNotification(task.employeeTask, 100, createTask);
