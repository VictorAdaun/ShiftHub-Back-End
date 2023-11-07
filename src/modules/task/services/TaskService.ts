import { Inject, Service } from "typedi";
import {
  EmployeeTaskRepository,
  TaskListRepository,
  TaskRepository,
} from "../repository/TaskRepository";
import { PRIORITY, TASK_ASSIGNED, TASK_STATUS } from "@prisma/client";
import {
  CreateDraftTaskRequest,
  CreateTaskRequest,
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

  async createTask(
    body: CreateTaskRequest | CreateDraftTaskRequest,
    userId: string,
    companyId: string
  ): Promise<PaginationResponse> {
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

    return await this.getCompanyTasks(companyId, body.isDraft);
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

    return await this.getCompanyTasks(companyId, task.isDraft);
  }

  async deleteNote(
    companyId: string,
    noteId: string
  ): Promise<SingleTaskResponse> {
    const list = await this.listRepo.findListItemById(noteId);
    if (!list || list.task.companyId !== companyId) {
      throw new NotFoundError("This note does not exist");
    }

    await this.listRepo.deleteListTask(noteId);

    return await this.getTask(list.taskId, companyId);
  }

  async updateNote(
    companyId: string,
    noteId: string,
    note: string
  ): Promise<SingleTaskResponse> {
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

    return await this.getTask(list.taskId, companyId);
  }

  async addTaskNote(
    companyId: string,
    taskId: string,
    note: string
  ): Promise<SingleTaskResponse> {
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
    taskId: string,
    collaborationId: string,
    companyId: string
  ): Promise<SingleTaskResponse> {
    const task = await this.taskRepo.findTaskById(taskId);
    if (!task || task.companyId !== companyId) {
      throw new NotFoundError("Task does not exist");
    }

    const collaborator = await this.employeeTaskRepo.findById(collaborationId);

    if (!collaborator || collaborator.taskId !== taskId) {
      throw new NotFoundError("User is not a collaborator on this task");
    }

    await this.employeeTaskRepo.deleteEmployeeTask(collaborationId);

    return await this.getTask(taskId, companyId);
  }

  async addTaskCollaborator(
    taskId: string,
    userId: string,
    companyId: string
  ): Promise<SingleTaskResponse> {
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
      returnSchema = companyTasks.map((task) => {
        return taskSchema(task);
      });
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
