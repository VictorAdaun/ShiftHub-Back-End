import {
  JsonController,
  Req,
  Get,
  UseBefore,
  Param,
  Post,
  QueryParam,
  Body,
  Put,
} from "routing-controllers";
import { EmployeeService } from "../services/EmployeeService";
import { Service } from "typedi";
import {
  EmployeeAuthMiddleware,
  UserRequest,
} from "../../../middlewares/UserAuthMiddleware";
import { OpenAPI } from "routing-controllers-openapi";
import { SingleTaskResponse } from "../../task/types/TaskTypes";
import { TaskService } from "../../task/services/TaskService";
import { PaginationResponse } from "../../../utils/request";
import { EditTimeOffRequest, TimeOffRequest } from "../types/EmployeeRequest";
import { PeriodDemandResponse } from "../../schedule/types/ScheduleTypes";
import { resetPasswordResponse } from "../../user/types/AuthTypes";
import { SwapResponse } from "../types/EmployeeTypes";

@JsonController()
@UseBefore(EmployeeAuthMiddleware)
@OpenAPI({ security: [{ bearerAuth: [] }] })
@Service()
export class EmployeeController {
  constructor(
    private employeeService: EmployeeService,
    private taskService: TaskService
  ) {}

  @Get("/task-list/user")
  async userTasks(
    @Req() req: UserRequest,
    @QueryParam("limit") limit: number,
    @QueryParam("page") page: number
  ): Promise<PaginationResponse> {
    return await this.employeeService.getUserTasks(req.userId, limit, page);
  }

  @Get("/task/:taskId")
  async getSingleTask(
    @Req() req: UserRequest,
    @Param("taskId") taskId: string
  ): Promise<SingleTaskResponse> {
    return await this.taskService.getTask(taskId, req.companyId);
  }

  @Get("/employee/shift")
  async userAvailableShifts(
    @Req() req: UserRequest,
    @QueryParam("limit") limit: number,
    @QueryParam("page") page: number
  ): Promise<PaginationResponse> {
    return await this.employeeService.getUpcomingShifts(
      req.userId,
      limit,
      page
    );
  }

  @Get("/available/shifts")
  async openShifts(
    @Req() req: UserRequest,
    @QueryParam("limit") limit: number,
    @QueryParam("page") page: number
  ): Promise<PaginationResponse> {
    return await this.employeeService.getAvailableSchedules(
      req.userId,
      limit,
      page
    );
  }

  @Get("/schedule/shift/:schedulePeriodDemandId")
  async getSchedulePeriod(
    @Req() req: UserRequest,
    @Param("schedulePeriodDemandId") schedulePeriodDemandId: string
  ): Promise<PeriodDemandResponse> {
    return await this.employeeService.getSchedulePeriodDemand(
      req.userId,
      schedulePeriodDemandId
    );
  }

  @Post("/employee/shift/:schedulePeriodId/:week/:year")
  async joinShift(
    @Req() req: UserRequest,
    @Param("schedulePeriodId") schedulePeriodId: string,
    @Param("week") week: string,
    @Param("year") year: string
  ): Promise<PaginationResponse> {
    return await this.employeeService.joinShift(
      req.userId,
      schedulePeriodId,
      week,
      year
    );
  }

  @Post("/employee/time-off")
  async requestTimeOff(
    @Req() req: UserRequest,
    @Body() body: TimeOffRequest
  ): Promise<PaginationResponse> {
    return await this.employeeService.requestTimeOff(
      req.userId,
      req.companyId,
      body
    );
  }

  @Get("/employee/time-off")
  async getUserRequests(
    @Req() req: UserRequest,
    @QueryParam("limit") limit: number,
    @QueryParam("page") page: number
  ): Promise<PaginationResponse> {
    return await this.employeeService.getAllUserTimeOffReuests(
      req.userId,
      req.companyId,
      limit,
      page
    );
  }

  @Put("/employee/time-off/:requestId")
  async updateUserRequest(
    @Req() req: UserRequest,
    @Param("requestId") requestId: string,
    @Body() body: EditTimeOffRequest
  ): Promise<PaginationResponse> {
    return await this.employeeService.updateUserRequest(
      req.userId,
      req.companyId,
      requestId,
      body
    );
  }

  @Get("/employee/upcoming-shifts")
  async getAvailableSwaps(
    @Req() req: UserRequest,
    @QueryParam("limit") limit: number,
    @QueryParam("page") page: number
  ): Promise<PaginationResponse> {
    return await this.employeeService.getAvailableSwaps(
      req.userId,
      req.companyId,
      limit,
      page
    );
  }

  @Post("/employee/swaps")
  async requestSwap(
    @Req() req: UserRequest,
    @QueryParam("requestId") requestId: string,
    @QueryParam("recieveId") recieveId: string
  ): Promise<resetPasswordResponse> {
    return await this.employeeService.requestSwap(
      req.userId,
      req.companyId,
      requestId,
      recieveId
    );
  }

  @Put("/employee/swaps/:swapId")
  async acceptOrRejectSwap(
    @Req() req: UserRequest,
    @Param("swapId") swapId: string,
    @QueryParam("status") status: boolean
  ): Promise<SwapResponse> {
    return await this.employeeService.acceptOrRejectSwap(
      req.userId,
      req.companyId,
      swapId,
      status
    );
  }

  @Get("/employee/swap/:swapId")
  async viewSwapDetails(
    @Req() req: UserRequest,
    @Param("swapId") swapId: string
  ): Promise<SwapResponse> {
    return await this.employeeService.viewSwapDetails(
      req.userId,
      req.companyId,
      swapId
    );
  }

  @Get("/employee/swaps")
  async getUserSwaps(
    @Req() req: UserRequest,
    @QueryParam("limit") limit: number,
    @QueryParam("page") page: number,
    @QueryParam("type") type: string
  ): Promise<PaginationResponse> {
    return await this.employeeService.getUserSwaps(
      req.userId,
      req.companyId,
      limit,
      page,
      type
    );
  }
}
