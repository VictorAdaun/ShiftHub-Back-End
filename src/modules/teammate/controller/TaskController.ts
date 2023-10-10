import { JsonController, Req, Get, UseBefore } from 'routing-controllers'
import { EmployeeService } from '../services/TaskService'
import { Service } from 'typedi'
import {
  UserAuthMiddleware,
  UserRequest,
} from '../../../middlewares/UserAuthMiddleware'
import { OpenAPI } from 'routing-controllers-openapi'
import { UserTaskResponse } from '../../task/types/TaskTypes'

@JsonController()
@UseBefore(UserAuthMiddleware)
@OpenAPI({ security: [{ bearerAuth: [] }] })
@Service()
export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  @Get('/task-list/user')
  async userTasks(@Req() req: UserRequest): Promise<UserTaskResponse> {
    return await this.employeeService.getUserTasks(req.userId)
  }
}
