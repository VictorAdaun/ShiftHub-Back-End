import {
  EmployeeTask,
  PRIORITY,
  Prisma,
  TASK_STATUS,
  Task,
  TaskList,
} from '@prisma/client'
import { Service } from 'typedi'

import { NotFoundError } from '../../../core/errors/errors'
import { prisma } from '../../../prismaClient'
import {
  CollaboratorTask,
  FullTaskDetails,
  ListWithTask,
} from '../types/TaskTypes'

@Service()
export class TaskRepository {
  async createTask(taskDetails: Prisma.TaskCreateInput): Promise<Task> {
    return await prisma.task.create({
      data: taskDetails,
    })
  }

  async findTaskById(id: string): Promise<FullTaskDetails | null> {
    return await prisma.task.findFirst({
      where: {
        AND: [{ id }, { deletedAt: null }],
      },
      include: {
        employeeTask: {
          include: {
            user: true,
          },
        },
        taskList: true,
        user: true,
      },
    })
  }

  async findTaskByCompanyId(
    companyId: string,
    isDraft: boolean,
    take: number,
    skip: number,
    status?: TASK_STATUS,
    priority?: PRIORITY
  ): Promise<FullTaskDetails[] | null> {
    return await prisma.task.findMany({
      where: {
        companyId,
        isDraft,
        status,
        priority,
        deletedAt: null,
      },
      take,
      skip,
      include: {
        employeeTask: {
          include: {
            user: true,
          },
        },
        taskList: true,
        user: true,
      },
    })
  }

  async findTaskByUserId(userId: string): Promise<FullTaskDetails[] | null> {
    return await prisma.task.findMany({
      where: {
        AND: [{ userId }, { deletedAt: null }],
      },
      include: {
        employeeTask: {
          include: {
            user: true,
          },
        },
        taskList: true,
        user: true,
      },
    })
  }

  async findTaskByIdOrThrow(id: string): Promise<FullTaskDetails> {
    const task = await prisma.task.findFirst({
      where: {
        AND: [{ id }, { deletedAt: null }],
      },
      include: {
        employeeTask: {
          include: {
            user: true,
          },
        },
        taskList: true,
        user: true,
      },
    })
    if (!task) {
      throw new NotFoundError('Task not found')
    }

    return task
  }

  async updateTask(body: Prisma.TaskUpdateInput, id: string): Promise<Task> {
    return await prisma.task.update({
      where: {
        id,
      },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    })
  }

  async deleteTask(id: string): Promise<void> {
    await prisma.task.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    })
  }
}

@Service()
export class TaskListRepository {
  async createTaskList(
    listDetails: Prisma.TaskListCreateInput
  ): Promise<TaskList> {
    return await prisma.taskList.create({
      data: listDetails,
    })
  }

  async findTaskListByTaskId(taskId: string): Promise<TaskList[] | null> {
    return await prisma.taskList.findMany({
      where: {
        AND: [{ taskId }, { deletedAt: null }],
      },
    })
  }

  async findListItemById(id: string): Promise<ListWithTask | null> {
    return await prisma.taskList.findFirst({
      where: {
        id,
      },
      include: {
        task: true,
      },
    })
  }

  async updateListTask(
    body: Prisma.TaskListUpdateInput,
    id: string
  ): Promise<TaskList> {
    return await prisma.taskList.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    })
  }

  async deleteListTask(id: string): Promise<void> {
    await prisma.taskList.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    })
  }
}

@Service()
export class EmployeeTaskRepository {
  async createEmployeeTask(
    taskMembers: Prisma.EmployeeTaskCreateInput
  ): Promise<EmployeeTask> {
    return await prisma.employeeTask.create({
      data: taskMembers,
    })
  }

  async deleteEmployeeTask(id: string): Promise<void> {
    await prisma.employeeTask.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    })
  }

  async findByTaskId(taskId: string): Promise<CollaboratorTask[] | null> {
    return await prisma.employeeTask.findMany({
      where: {
        AND: [{ taskId }, { deletedAt: null }],
      },
      include: {
        task: true,
      },
    })
  }

  async findByUserId(
    userId: string,
    take: number,
    skip: number
  ): Promise<CollaboratorTask[] | null> {
    return await prisma.employeeTask.findMany({
      where: {
        AND: [{ userId }, { deletedAt: null }],
      },
      take,
      skip,
      include: {
        task: true,
      },
    })
  }

  async findById(id: string): Promise<EmployeeTask | null> {
    return await prisma.employeeTask.findFirst({
      where: {
        AND: [{ id }, { deletedAt: null }],
      },
    })
  }

  async findByUserAndTask(
    userId: string,
    taskId: string
  ): Promise<EmployeeTask | null> {
    return await prisma.employeeTask.findFirst({
      where: {
        AND: [{ userId }, { taskId }],
      },
    })
  }

  async updateCollaboration(
    body: Prisma.EmployeeTaskUpdateInput,
    id: string
  ): Promise<EmployeeTask> {
    return await prisma.employeeTask.update({
      where: {
        id,
      },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    })
  }
}
