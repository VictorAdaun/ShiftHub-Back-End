import {
  JsonController,
  Req,
  Get,
  UseBefore,
  Param,
  Body,
  Put,
} from "routing-controllers";
import { TaskService } from "../services/TaskService";
import { Service } from "typedi";
import {
  UserAuthMiddleware,
  UserRequest,
} from "../../../middlewares/UserAuthMiddleware";
import { OpenAPI } from "routing-controllers-openapi";
import { SingleTaskResponse } from "../types/TaskTypes";
import {
  EditTaskRequest,
  UpdateTaskRequest,
  UpdateTaskStatusRequest,
} from "../types/TaskRequest";

@JsonController()
@UseBefore(UserAuthMiddleware)
@OpenAPI({ security: [{ bearerAuth: [] }] })
@Service()
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Get("/task/:taskId")
  async getSingleTask(
    @Req() req: UserRequest,
    @Param("taskId") taskId: string
  ): Promise<SingleTaskResponse> {
    return await this.taskService.getTask(taskId, req.companyId);
  }

  @Put("/task-update/:taskId")
  async updateTask(
    @Req() req: UserRequest,
    @Param("taskId") taskId: string,
    @Body() body: UpdateTaskRequest
  ): Promise<SingleTaskResponse> {
    return await this.taskService.updateTask(
      req.userId,
      req.companyId,
      taskId,
      body.status
    );
  }

  @Put("/edit-task/:taskId")
  async editTask(
    @Req() req: UserRequest,
    @Param("taskId") taskId: string,
    @Body() body: EditTaskRequest
  ): Promise<SingleTaskResponse> {
    return await this.taskService.editTaskRequest(
      req.userId,
      req.companyId,
      taskId,
      body
    );
  }

  @Put("/task-status/:noteId")
  async updateTaskNote(
    @Req() req: UserRequest,
    @Param("noteId") noteId: string,
    @Body() body: UpdateTaskStatusRequest
  ): Promise<SingleTaskResponse> {
    return await this.taskService.toggleTask(
      req.userId,
      req.companyId,
      noteId,
      body.value
    );
  }
}
