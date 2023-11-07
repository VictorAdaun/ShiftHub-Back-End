import {
  Body,
  JsonController,
  Post,
  Req,
  Get,
  UseBefore,
  QueryParam,
  Param,
  Delete,
  Put,
} from "routing-controllers";
import { ManagerService } from "../services/ManagerService";
import { TaskService } from "../../task/services/TaskService";
import { Service } from "typedi";
import {
  CreateDraftTaskRequest,
  CreateTaskRequest,
  UpdateNoteRequest,
} from "../../task/types/TaskRequest";
import { UserRequest } from "../../../middlewares/UserAuthMiddleware";
import { OpenAPI } from "routing-controllers-openapi";
import { SingleTaskResponse, TaskResponse } from "../../task/types/TaskTypes";
import { PRIORITY, TASK_STATUS } from "@prisma/client";
import { AdminAuthMiddleware } from "../../../middlewares/AdminAuthMiddleware";
import {
  CreateScheduleRequest,
  ViewScheduleRequest,
} from "../../schedule/types/ScheduleRequest";
import { CreateScheduleResponse } from "../../schedule/types/ScheduleTypes";
import { ScheduleService } from "../../schedule/services/ScheduleService";
import { UserResponse, UserRole, UserSchema } from "../../user/types/AuthTypes";

@JsonController()
@UseBefore(AdminAuthMiddleware)
@OpenAPI({ security: [{ bearerAuth: [] }] })
@Service()
export class ManagerController {
  constructor(
    private taskService: TaskService,
    private managerService: ManagerService,
    private scheduleService: ScheduleService
  ) {}

  @Post("/task/create")
  async createTask(
    @Req() req: UserRequest,
    @Body() body: CreateTaskRequest
  ): Promise<TaskResponse> {
    return await this.taskService.createTask(body, req.userId, req.companyId);
  }

  @Post("/task/create-draft")
  async createDraftTask(
    @Req() req: UserRequest,
    @Body() body: CreateDraftTaskRequest
  ): Promise<TaskResponse> {
    return await this.taskService.createTask(body, req.userId, req.companyId);
  }

  @Get("/tasks/company")
  async getCompanyTasks(
    @Req() req: UserRequest,
    @QueryParam("priority") priority: PRIORITY,
    @QueryParam("status") status: TASK_STATUS,
    @QueryParam("draft") draft: boolean,
    @QueryParam("limit") limit: number,
    @QueryParam("page") page: number
  ): Promise<TaskResponse> {
    return await this.taskService.getCompanyTasks(
      req.companyId,
      draft,
      status,
      priority,
      limit,
      page
    );
  }

  @Put("/task/:taskId")
  async publishDraft(
    @Req() req: UserRequest,
    @Param("taskId") taskId: string
  ): Promise<SingleTaskResponse> {
    return await this.taskService.publishTask(taskId, req.companyId);
  }

  @Get("/task/:taskId")
  async getSingleTask(
    @Req() req: UserRequest,
    @Param("taskId") taskId: string
  ): Promise<SingleTaskResponse> {
    return await this.taskService.getTask(taskId, req.companyId);
  }

  @UseBefore(AdminAuthMiddleware)
  @Put("/task/remove-collaborator/:taskId/:id")
  async removeTaskCollaborator(
    @Req() req: UserRequest,
    @Param("taskId") taskId: string,
    @Param("id") id: string
  ): Promise<any> {
    return await this.taskService.removeTaskCollaborator(
      taskId,
      id,
      req.companyId
    );
  }

  @Put("/task/add-collaborator/:taskId/:userId")
  async addTaskCollaborator(
    @Req() req: UserRequest,
    @Param("taskId") taskId: string,
    @Param("userId") userId: string
  ): Promise<any> {
    return await this.taskService.addTaskCollaborator(
      taskId,
      userId,
      req.companyId
    );
  }

  @Delete("/task/delete/:taskId")
  async deleteTask(
    @Req() req: UserRequest,
    @Param("taskId") taskId: string
  ): Promise<TaskResponse> {
    return await this.taskService.deleteTask(req.companyId, taskId);
  }

  @Delete("/task-list/delete/:noteId")
  async deleteTaskNote(
    @Req() req: UserRequest,
    @Param("noteId") noteId: string
  ): Promise<SingleTaskResponse> {
    return await this.taskService.deleteNote(req.companyId, noteId);
  }

  @Put("/task-list/update/:noteId")
  async updateTaskNote(
    @Req() req: UserRequest,
    @Param("noteId") noteId: string,
    @Body() body: UpdateNoteRequest
  ): Promise<SingleTaskResponse> {
    return await this.taskService.updateNote(req.companyId, noteId, body.note);
  }

  @Put("/task-list/add/:taskId")
  async addTaskNote(
    @Req() req: UserRequest,
    @Param("taskId") taskId: string,
    @Body() body: UpdateNoteRequest
  ): Promise<SingleTaskResponse> {
    return await this.taskService.addTaskNote(req.companyId, taskId, body.note);
  }

  @Post("/schedule/create")
  async createSchedule(
    @Req() req: UserRequest,
    @Body() body: CreateScheduleRequest
  ): Promise<CreateScheduleResponse> {
    return await this.scheduleService.createSchedule(
      body,
      req.userId,
      req.companyId
    );
  }

  @Get("/schedule/:scheduleId")
  async getSchedule(
    @Req() req: UserRequest,
    @Param("scheduleId") scheduleId: string,
    @Body() body: ViewScheduleRequest
  ): Promise<CreateScheduleResponse> {
    return await this.scheduleService.getScheduleDetails(
      scheduleId,
      req.userId,
      req.companyId,
      body
    );
  }

  @Delete("user/:userId")
  async delereUser(
    @Req() req: UserRequest,
    @Param("userId") userId: string
  ): Promise<UserResponse> {
    return await this.managerService.deleteUser(
      userId,
      req.userId,
      req.companyId
    );
  }

  @Put("user/:userId")
  async blacklistUser(
    @Req() req: UserRequest,
    @Param("userId") userId: string
  ): Promise<UserResponse> {
    return await this.managerService.blacklistUser(
      userId,
      req.userId,
      req.companyId
    );
  }
}
