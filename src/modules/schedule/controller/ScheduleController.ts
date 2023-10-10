import {
  JsonController,
  UseBefore,
  Post,
  Req,
  Body,
  Get,
  Param,
} from 'routing-controllers'
import { OpenAPI } from 'routing-controllers-openapi'
import { Service } from 'typedi'
import {
  UserAuthMiddleware,
  UserRequest,
} from '../../../middlewares/UserAuthMiddleware'
import { ScheduleService } from '../services/ScheduleService'
import { CreateScheduleRequest } from '../types/ScheduleRequest'
import { CreateScheduleResponse } from '../types/ScheduleTypes'

@JsonController()
@UseBefore(UserAuthMiddleware)
@OpenAPI({ security: [{ bearerAuth: [] }] })
@Service()
export class ScheduleController {
  constructor(private scheduleService: ScheduleService) {}

  @Post('/schedule/create')
  async createSchedule(
    @Req() req: UserRequest,
    @Body() body: CreateScheduleRequest
  ): Promise<CreateScheduleResponse> {
    return await this.scheduleService.createSchedule(
      body,
      req.userId,
      req.companyId
    )
  }

  @Get('/schedule/:scheduleId')
  async getSchedule(
    @Req() req: UserRequest,
    @Param('scheduleId') scheduleId: string
  ): Promise<CreateScheduleResponse> {
    return await this.scheduleService.getScheduleDetails(
      scheduleId,
      req.userId,
      req.companyId
    )
  }
}
