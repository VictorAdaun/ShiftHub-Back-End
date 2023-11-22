import { Inject, Service } from "typedi";
import {
  EmployeeTaskRepository,
  TaskListRepository,
  TaskRepository,
} from "../repository/TaskRepository";
import {
  NOTIFICATION_TYPE,
  PRIORITY,
  TASK_ASSIGNED,
  TASK_STATUS,
  USER_TYPE,
} from "@prisma/client";
import {
  CreateDraftTaskRequest,
  CreateTaskRequest,
  EditTaskRequest,
} from "../types/TaskRequest";
import { AuthRepository } from "../../user/repository/AuthRepository";
import { ConflictError, NotFoundError } from "../../../core/errors/errors";
import {
  FullTaskDetails,
  SingleTaskResponse,
  TaskDetails,
  TaskMember,
  TaskNote,
} from "../types/TaskTypes";
import { CompanyRepository } from "../../user/repository/CompanyRepository";
import { PaginationResponse, paginate } from "../../../utils/request";
import { NotificationRepository } from "../../employee/repository/NotificationsRepository";
import { NotficationService } from "../../employee/services/NotificationService";

@Service()
export class TaskService {
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
  private notificationService: NotficationService;

  async createTask(
    body: CreateTaskRequest | CreateDraftTaskRequest,
    userId: string,
    companyId: string
  ): Promise<PaginationResponse> {
    const user = await this.authRepo.findUserByIdOrThrow(userId);
    if (user.userType !== USER_TYPE.ADMIN) {
      throw new NotFoundError(
        "You do not have the permission to perform this action"
      );
    }

    const findTitle = await this.taskRepo.findTaskByTitle(
      companyId,
      body.title
    );
    if (findTitle) {
      throw new NotFoundError("You already have a task with this title");
    }

    const task = await this.taskRepo.createTask({
      title: body.title,
      description: body.description,
      isDraft: body.isDraft,
      startDate: body.startDate,
      endDate: body.endDate,
      assignType: body.assignType,
      status: body.status,
      priority: body.priority,
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
    });

    if (body.assignType == TASK_ASSIGNED.MEMBERS) {
      if (body.employees) {
        body.employees.map(async (memeber) => {
          await this.employeeTaskRepo.createEmployeeTask({
            task: {
              connect: {
                id: task.id,
              },
            },
            user: {
              connect: {
                id: memeber.id,
              },
            },
            isTaskLead: memeber?.isTaskLead,
          });
        });
      }
    } else {
      //find all people in the shift
      //assign to all of them
    }

    if (body.notes) {
      body.notes.map(async (list) => {
        await this.listRepo.createTaskList({
          task: {
            connect: {
              id: task.id,
            },
          },
          note: list,
        });
      });
    }

    if (!task.isDraft) await this.notificationService.createTask(task.id);

    const tasks = await this.getCompanyTasks(companyId, body.isDraft);
    tasks.message = "Task created successfully";
    return tasks;
  }

  async deleteTask(
    companyId: string,
    taskId: string
  ): Promise<PaginationResponse> {
    const task = await this.taskRepo.findTaskById(taskId);
    if (!task || task.companyId !== companyId) {
      throw new NotFoundError("Task does not exist");
    }

    task.employeeTask.map(async (task) => {
      await this.employeeTaskRepo.deleteEmployeeTask(task.id);
    });

    task.taskList.map(async (task) => {
      await this.listRepo.deleteListTask(task.id);
    });
    await this.taskRepo.deleteTask(taskId);

    const tasks = await this.getCompanyTasks(companyId, task.isDraft);
    tasks.message = "Task deleted successfully";
    return tasks;
  }

  async deleteNote(
    userId: string,
    companyId: string,
    noteId: string
  ): Promise<SingleTaskResponse> {
    const user = await this.authRepo.findUserByIdInCompany(userId, companyId);
    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    const list = await this.listRepo.findListItemById(noteId);
    if (!list || list.task.companyId !== companyId) {
      throw new NotFoundError("This note does not exist");
    }

    await this.listRepo.deleteListTask(noteId);

    await this.notificationService.sendUpdateTask(list.taskId, userId);

    return await this.getTask(list.taskId, companyId);
  }

  async updateNote(
    userId: string,
    companyId: string,
    noteId: string,
    note: string
  ): Promise<SingleTaskResponse> {
    const user = await this.authRepo.findUserByIdInCompany(userId, companyId);
    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    const list = await this.listRepo.findListItemById(noteId);
    if (!list || list.task.companyId !== companyId) {
      throw new NotFoundError("This note does not exist");
    }

    await this.listRepo.updateListTask(
      {
        note,
        updatedAt: new Date(),
      },
      noteId
    );

    await this.notificationService.sendUpdateTask(list.taskId, userId);

    return await this.getTask(list.taskId, companyId);
  }

  async toggleTask(
    userId: string,
    companyId: string,
    noteId: string,
    value: boolean
  ): Promise<SingleTaskResponse> {
    const user = await this.authRepo.findUserByIdInCompany(userId, companyId);
    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    const note = await this.listRepo.findListItemById(noteId);
    if (!note || note.task.companyId !== companyId) {
      throw new NotFoundError("This note does not exist");
    }

    if (note.checked == value) {
      throw new NotFoundError("Cannot change status of note to same");
    }

    await this.listRepo.updateListTask(
      {
        checked: value,
      },
      noteId
    );

    await this.notificationService.sendUpdateTask(note.taskId, userId);

    return await this.getTask(note.taskId, companyId);
  }

  async updateTask(
    userId: string,
    companyId: string,
    taskId: string,
    status: TASK_STATUS
  ): Promise<SingleTaskResponse> {
    const user = await this.authRepo.findUserByIdInCompany(userId, companyId);
    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    const task = await this.taskRepo.findTaskById(taskId);
    if (!task || task.companyId !== companyId) {
      throw new NotFoundError("Task not found");
    }

    await this.taskRepo.updateTask(
      {
        status,
      },
      taskId
    );

    await this.notificationService.sendUpdateTask(taskId, userId);

    const taskUpdate = await this.getTask(taskId, companyId);
    taskUpdate.message = "Task updated successfully";

    return taskUpdate;
  }

  async editTaskRequest(
    userId: string,
    companyId: string,
    taskId: string,
    body: EditTaskRequest
  ): Promise<SingleTaskResponse> {
    const user = await this.authRepo.findUserByIdInCompany(userId, companyId);
    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    const task = await this.taskRepo.findTaskById(taskId);
    if (!task || task.companyId !== companyId) {
      throw new NotFoundError("Task not found");
    }

    const data: any = {};
    if (body.description) data.description = body.description;
    if (body.title) data.title = body.title;
    if (body.startDate) data.startDate = body.startDate;
    if (body.endDate) data.endDate = body.endDate;
    if (body.priority) data.priority = body.priority;
    if (body.isDraft) data.isDraft = body.isDraft;

    await this.notificationService.sendUpdateTask(taskId, userId);

    const taskUpdate = await this.getTask(taskId, companyId);
    taskUpdate.message = "Task updated successfully";

    return taskUpdate;
  }

  async addTaskNote(
    userId: string,
    companyId: string,
    taskId: string,
    note: string
  ): Promise<SingleTaskResponse> {
    const user = await this.authRepo.findUserByIdInCompany(userId, companyId);
    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    const task = await this.taskRepo.findTaskById(taskId);
    if (!task || task.companyId !== companyId) {
      throw new NotFoundError("Task does not exist");
    }

    await this.listRepo.createTaskList({
      task: {
        connect: {
          id: taskId,
        },
      },
      note,
    });

    await this.notificationService.sendUpdateTask(taskId, userId);

    return await this.getTask(taskId, companyId);
  }

  async publishTask(
    taskId: string,
    companyId: string
  ): Promise<SingleTaskResponse> {
    const task = await this.taskRepo.findTaskById(taskId);
    if (!task || task.companyId !== companyId) {
      throw new NotFoundError("Task does not exist");
    }

    if (!task.isDraft) {
      throw new ConflictError("Task is already published");
    }

    const updatedTask = await this.taskRepo.updateTask(
      {
        isDraft: false,
      },
      taskId
    );

    await this.notificationService.createTask(task.id);

    return {
      message: "Task retrieved successfully",
      tasks: taskSchema(updatedTask),
    };
  }

  async getTask(
    taskId: string,
    companyId: string
  ): Promise<SingleTaskResponse> {
    const task = await this.taskRepo.findTaskById(taskId);
    if (!task || task.companyId !== companyId) {
      throw new NotFoundError("Task does not exist");
    }

    return {
      message: "Task retrieved successfully",
      tasks: taskSchema(task),
    };
  }

  async removeTaskCollaborator(
    adminId: string,
    taskId: string,
    collaborationId: string,
    companyId: string
  ): Promise<SingleTaskResponse> {
    const admin = await this.authRepo.findUserByIdInCompany(adminId, companyId);
    if (!admin) {
      throw new NotFoundError("User does not exist");
    }

    if (admin.userType !== USER_TYPE.ADMIN) {
      throw new NotFoundError(
        "You do not have the permission to perform this action"
      );
    }

    const task = await this.taskRepo.findTaskById(taskId);
    if (!task || task.companyId !== companyId) {
      throw new NotFoundError("Task does not exist");
    }

    const collaborator = await this.employeeTaskRepo.findById(collaborationId);

    if (!collaborator || collaborator.taskId !== taskId) {
      throw new NotFoundError("User is not a collaborator on this task");
    }

    await this.employeeTaskRepo.deleteEmployeeTask(collaborationId);

    await this.notificationService.removeNotification(
      taskId,
      collaborator.userId,
      adminId
    );

    return await this.getTask(taskId, companyId);
  }

  async addTaskCollaborator(
    adminId: string,
    taskId: string,
    userId: string,
    companyId: string
  ): Promise<SingleTaskResponse> {
    const admin = await this.authRepo.findUserByIdInCompany(adminId, companyId);
    if (!admin) {
      throw new NotFoundError("User does not exist");
    }

    if (admin.userType !== USER_TYPE.ADMIN) {
      throw new NotFoundError(
        "You do not have the permission to perform this action"
      );
    }

    const task = await this.taskRepo.findTaskById(taskId);
    if (!task || task.companyId !== companyId) {
      throw new NotFoundError("Task does not exist");
    }

    const user = await this.authRepo.findUserByIdInCompany(userId, companyId);
    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    const collaborator = await this.employeeTaskRepo.findByUserAndTask(
      userId,
      taskId
    );

    if (collaborator) {
      if (!collaborator.deletedAt) {
        throw new NotFoundError("User already exists as a collaborator");
      }
      await this.employeeTaskRepo.updateCollaboration(
        {
          deletedAt: null,
        },
        collaborator.id
      );
    } else {
      await this.employeeTaskRepo.createEmployeeTask({
        task: {
          connect: {
            id: task.id,
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },
      });
    }

    await this.notificationService.addTaskNotification(taskId, userId, adminId);

    return await this.getTask(taskId, companyId);
  }

  async getCompanyTasks(
    companyId: string,
    query: boolean = false,
    type?: TASK_STATUS,
    priority?: PRIORITY,
    limit?: number,
    page?: number
  ): Promise<PaginationResponse> {
    const company = await this.companyRepo.findCompanyById(companyId);
    if (!company) {
      throw new NotFoundError("Company does not exist. Kindly contact support");
    }

    limit = limit ? limit : 10;
    page = page ? page : 1;
    const skip = page ? (page - 1) * limit : 1 * limit;

    const companyTasks = await this.taskRepo.findTaskByCompanyId(
      companyId,
      query,
      limit,
      skip,
      type,
      priority
    );
    let returnSchema: TaskDetails[] = [];
    let total = 0;

    if (companyTasks) {
      total = companyTasks.length;
      returnSchema = companyTasks.map((task) => taskSchema(task));
    }

    return {
      message: "Tasks retrieved successfully",
      data: paginate(returnSchema, page, limit, total),
    };
  }
}

function taskSchema(task: FullTaskDetails): TaskDetails {
  const members: TaskMember[] = [];
  const notes: TaskNote[] = [];

  if (task.employeeTask) {
    task.employeeTask.map(async (member) => {
      if (!member.deletedAt) {
        members.push({
          id: member.id,
          userId: member.userId,
          avatar: member.user.avatar,
          fullName: member.user.fullName,
          isTaskLead: member.isTaskLead,
        });
      }
    });
  }

  if (task.taskList) {
    task.taskList.map((list) => {
      if (!list.deletedAt) {
        notes.push({
          id: list.id,
          note: list.note,
          checked: list.checked,
        });
      }
    });
  }

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    ownerId: task.user.id,
    owner: task.user.fullName,
    ownerAvatar: task.user.avatar,
    endDate: task.endDate ? task.endDate : null,
    startDate: task.startDate ? task.startDate : null,
    status: task.status,
    priority: task.priority,
    notes,
    members,
  };
}
