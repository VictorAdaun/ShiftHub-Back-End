import {
  JsonController,
  Req,
  Get,
  UseBefore,
  Param,
  Post,
} from 'routing-controllers'
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
import { UserShiftResponse } from '../../schedule/types/ScheduleTypes'

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
  async userAvailableShifts(
    @Req() req: UserRequest
  ): Promise<UserShiftResponse> {
    return await this.employeeService.getUpcomingShifts(req.userId)
  }

  @Get('/available/shifts')
  async openShifts(@Req() req: UserRequest): Promise<UserShiftResponse> {
    return await this.employeeService.getAvailableShifts(req.userId)
  }

  @Post('/employee/shift/:schedulePeriodId/:week/:year')
  async joinShift(
    @Req() req: UserRequest,
    @Param('schedulePeriodId') schedulePeriodId: string,
    @Param('week') week: string,
    @Param('year') year: string
  ): Promise<any> {
    return await this.employeeService.joinShift(
      req.userId,
      schedulePeriodId,
      week,
      year
    )
  }
}
