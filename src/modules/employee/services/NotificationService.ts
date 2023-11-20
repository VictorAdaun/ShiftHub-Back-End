import { Inject, Service } from "typedi";
import {
  EmployeeTaskRepository,
  TaskRepository,
} from "../../task/repository/TaskRepository";
import { NOTIFICATION_TYPE } from "@prisma/client";
import { AuthRepository } from "../../user/repository/AuthRepository";
import { NotFoundError } from "../../../core/errors/errors";
import { EmployeeTaskUserDetails } from "../../task/types/TaskTypes";
import { CompanyRepository } from "../../user/repository/CompanyRepository";
import { ScheduleRepository } from "../../schedule/repository/ScheduleRepository";
import { TimeOffRepository } from "../repository/TimeOffRepository";
import { NotificationRepository } from "../repository/NotificationsRepository";
import { ShiftSwapRepository } from "../repository/ShiftSwapRepository";

@Service()
export class NotficationService {
  @Inject()
  private taskRepo: TaskRepository;

  @Inject()
  private authRepo: AuthRepository;

  @Inject()
  private timeOffRepo: TimeOffRepository;

  @Inject()
  private shiftSwapRepo: ShiftSwapRepository;

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
      this.sendCreateTaskNotification.bind(this)
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

  async requestShiftSwap(swapId: string): Promise<void> {
    const request = await this.shiftSwapRepo.findById(swapId);
    if (!request) {
      throw new NotFoundError("Request not found");
    }

    await this.notificationRepo.createNotification({
      user: {
        connect: {
          id: request.reciever.id,
        },
      },
      triggerUser: {
        connect: {
          id: request.requester.id,
        },
      },
      tagId: swapId,
      type: NOTIFICATION_TYPE.SHIFT,
      activity: `${request.requester.firstName} ${request.requester.lastName[0]}. is requesting a shift swap`,
    });
  }

  async respondShiftSwap(swapId: string): Promise<void> {
    const request = await this.shiftSwapRepo.findById(swapId);
    if (!request) {
      throw new NotFoundError("Request not found");
    }

    const answer = request.status == "APPROVED" ? "accepted" : "rejected";

    await this.notificationRepo.createNotification({
      user: {
        connect: {
          id: request.requester.id,
        },
      },
      triggerUser: {
        connect: {
          id: request.reciever.id,
        },
      },
      tagId: swapId,
      type: NOTIFICATION_TYPE.SHIFT,
      activity: `${request.requester.firstName} ${request.requester.lastName[0]}. ${answer} your swap request`,
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
