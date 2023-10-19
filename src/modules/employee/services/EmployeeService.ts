import { Inject, Service } from 'typedi'
import {
  EmployeeTaskRepository,
  TaskListRepository,
  TaskRepository,
} from '../../task/repository/TaskRepository'
import { PRIORITY, TASK_ASSIGNED, TASK_STATUS, Task } from '@prisma/client'
import { AuthRepository } from '../../user/repository/AuthRepository'
import { NotFoundError, UnauthorizedError } from '../../../core/errors/errors'
import {
  CollaboratorTask,
  EmployeeTaskDetails,
  FullTaskDetails,
  TaskDetails,
  TaskMember,
  TaskNote,
  UserTaskResponse,
} from '../../task/types/TaskTypes'
import { CompanyRepository } from '../../user/repository/CompanyRepository'
import { ScheduleRepository } from '../../schedule/repository/ScheduleRepository'

@Service()
export class EmployeeService {
  @Inject()
  private taskRepo: TaskRepository

  @Inject()
  private authRepo: AuthRepository

  @Inject()
  private companyRepo: CompanyRepository

  @Inject()
  private listRepo: TaskListRepository

  @Inject()
  private employeeTaskRepo: EmployeeTaskRepository

  @Inject()
  private scheduleRepo: ScheduleRepository

  async getUserTasks(
    userId: string,
    limit?: number,
    page?: number
  ): Promise<UserTaskResponse> {
    const employeeTask = await this.employeeTaskRepo.findByUserId(userId)
    let returnSchema: EmployeeTaskDetails[] = []
    let total = 0

    limit = limit ? limit : 10
    page = page ? page : 1

    if (employeeTask) {
      total = employeeTask.length
      returnSchema = employeeTask.map((taskDetails: CollaboratorTask) =>
        individualTaskSchema(taskDetails.task)
      )
    }

    const lastpage = Math.ceil(total / limit)
    const nextpage = page + 1 > lastpage ? null : page + 1
    const prevpage = page - 1 < 1 ? null : page - 1

    return {
      message: 'Tasks retrieved successfully',
      tasks: returnSchema,
      total,
      lastpage,
      nextpage,
      prevpage,
    }
  }

  async getUpcomingShifts(
    userId: string,
    limit?: number,
    page?: number
  ): Promise<UserTaskResponse> {
    const employeeTask = await this.employeeTaskRepo.findByUserId(userId)
    let returnSchema: EmployeeTaskDetails[] = []
    let total = 0

    limit = limit ? limit : 10
    page = page ? page : 1

    if (employeeTask) {
      total = employeeTask.length
      returnSchema = employeeTask.map((taskDetails: CollaboratorTask) =>
        individualTaskSchema(taskDetails.task)
      )
    }

    const lastpage = Math.ceil(total / limit)
    const nextpage = page + 1 > lastpage ? null : page + 1
    const prevpage = page - 1 < 1 ? null : page - 1

    return {
      message: 'Tasks retrieved successfully',
      tasks: returnSchema,
      total,
      lastpage,
      nextpage,
      prevpage,
    }
  }
}

function taskSchema(task: FullTaskDetails): TaskDetails {
  const members: TaskMember[] = []
  const notes: TaskNote[] = []

  if (task.employeeTask) {
    task.employeeTask.map(async (member) => {
      if (!member.deletedAt) {
        members.push({
          id: member.id,
          userId: member.userId,
          avatar: member.user.avatar,
          fullName: member.user.fullName,
          isTaskLead: member.isTaskLead,
        })
      }
    })
  }

  if (task.taskList) {
    task.taskList.map((list) => {
      if (!list.deletedAt) {
        notes.push({
          id: list.id,
          note: list.note,
          checked: list.checked,
        })
      }
    })
  }

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    ownerId: task.user.id,
    owner: task.user.fullName,
    ownerAvatar: task.user.avatar,
    dueDate: task.dueDate ? task.dueDate : null,
    status: task.status,
    priority: task.priority,
    notes,
    members,
  }
}

function individualTaskSchema(task: Task): EmployeeTaskDetails {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    ownerId: task.userId,
    dueDate: task.dueDate ? task.dueDate : null,
    status: task.status,
    priority: task.priority,
  }
}
