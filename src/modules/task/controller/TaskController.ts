import { JsonController, Req, Get, UseBefore, Param } from 'routing-controllers'
import { TaskService } from '../services/TaskService'
import { Service } from 'typedi'
import {
  UserAuthMiddleware,
  UserRequest,
} from '../../../middlewares/UserAuthMiddleware'
import { OpenAPI } from 'routing-controllers-openapi'
import { SingleTaskResponse } from '../types/TaskTypes'

@JsonController()
@UseBefore(UserAuthMiddleware)
@OpenAPI({ security: [{ bearerAuth: [] }] })
@Service()
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Get('/task/:taskId')
  async getSingleTask(
    @Req() req: UserRequest,
    @Param('taskId') taskId: string
  ): Promise<SingleTaskResponse> {
    return await this.taskService.getTask(taskId, req.companyId)
  }
}
