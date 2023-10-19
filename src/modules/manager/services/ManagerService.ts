import { Inject, Service } from 'typedi'
import {
  EmployeeTaskRepository,
  TaskListRepository,
  TaskRepository,
} from '../../task/repository/TaskRepository'
import { PRIORITY, TASK_ASSIGNED, TASK_STATUS, Task } from '@prisma/client'
import {
  CreateDraftTaskRequest,
  CreateTaskRequest,
} from '../../task/types/TaskRequest'
import { AuthRepository } from '../../user/repository/AuthRepository'
import { NotFoundError } from '../../../core/errors/errors'
import {
  EmployeeTaskDetails,
  FullTaskDetails,
  SingleTaskResponse,
  TaskDetails,
  TaskMember,
  TaskNote,
  TaskResponse,
  UserTaskResponse,
} from '../../task/types/TaskTypes'
import { CompanyRepository } from '../../user/repository/CompanyRepository'
import { CollaboratorTask } from '../../task/types/TaskTypes'

@Service()
export class ManagerService {
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

  async createTask(
    body: CreateTaskRequest | CreateDraftTaskRequest,
    userId: string,
    companyId: string
  ): Promise<any> {}
}
