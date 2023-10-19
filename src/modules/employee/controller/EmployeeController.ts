import { JsonController, Req, Get, UseBefore, Param } from 'routing-controllers'
import { EmployeeService } from '../services/EmployeeService'
import { Service } from 'typedi'
import {
  UserAuthMiddleware,
  UserRequest,
} from '../../../middlewares/UserAuthMiddleware'
import { OpenAPI } from 'routing-controllers-openapi'
import {
  SingleTaskResponse,
  UserTaskResponse,
} from '../../task/types/TaskTypes'
import { TaskService } from '../../task/services/TaskService'

@JsonController()
@UseBefore(UserAuthMiddleware)
@OpenAPI({ security: [{ bearerAuth: [] }] })
@Service()
export class EmployeeController {
  constructor(
    private employeeService: EmployeeService,
    private taskService: TaskService
  ) {}

  @Get('/task-list/user')
  async userTasks(@Req() req: UserRequest): Promise<UserTaskResponse> {
    return await this.employeeService.getUserTasks(req.userId)
  }

  @Get('/task/:taskId')
  async getSingleTask(
    @Req() req: UserRequest,
    @Param('taskId') taskId: string
  ): Promise<SingleTaskResponse> {
    return await this.taskService.getTask(taskId, req.companyId)
  }

  @Get('/employee/shift')
  async availableShifts(@Req() req: UserRequest): Promise<UserTaskResponse> {
    return await this.employeeService.getUpcomingShifts(req.userId)
  }
}
