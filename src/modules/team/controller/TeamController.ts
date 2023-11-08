import {
  Body,
  Get,
  JsonController,
  Param,
  Post,
  Put,
  QueryParam,
  Req,
  UseBefore,
} from "routing-controllers";
import { OpenAPI } from "routing-controllers-openapi";
import { Service } from "typedi";
import {
  UserAuthMiddleware,
  UserRequest,
} from "../../../middlewares/UserAuthMiddleware";
import { TeamService } from "../services/TeamService";
import { AdminAuthMiddleware } from "../../../middlewares/AdminAuthMiddleware";
import { EditOrganizationRequest } from "../types/TeamRequest";
import { PaginationResponse } from "../../../utils/request";

@JsonController()
@UseBefore(AdminAuthMiddleware)
@OpenAPI({ security: [{ bearerAuth: [] }] })
@Service()
export class TeamController {
  constructor(private teamService: TeamService) {}

  @Get("/team/invites")
  async getTeamInvites(
    @Req() req: UserRequest,
    @QueryParam("limit") limit: number,
    @QueryParam("page") page: number
  ): Promise<any> {
    return await this.teamService.pendingInvites(req.companyId, limit, page);
  }

  @Get("/team/department")
  async getTeamDepartments(@Req() req: UserRequest): Promise<any> {
    return await this.teamService.getTeamDepartments(req.companyId);
  }

  @Get("/team/dashboard/count")
  async getTeamDetails(@Req() req: UserRequest): Promise<any> {
    return await this.teamService.getCountDetails(req.companyId);
  }

  @Get("/team/:search")
  async searchTeam(
    @Req() req: UserRequest,
    @Param("search") search: string,
    @QueryParam("limit") limit: number,
    @QueryParam("page") page: number
  ): Promise<any> {
    return await this.teamService.searchName(
      search,
      req.companyId,
      limit,
      page
    );
  }

  @Get("/team/dashboard/users")
  async getUsers(
    @Req() req: UserRequest,
    @QueryParam("limit") limit: number,
    @QueryParam("page") page: number
  ): Promise<PaginationResponse> {
    return await this.teamService.usersDetails(req.companyId, limit, page);
  }

  @Get("/team/dashboard/users/:search")
  async searchDashboardUsers(
    @Req() req: UserRequest,
    @Param("search") search: string,
    @QueryParam("limit") limit: number,
    @QueryParam("page") page: number
  ): Promise<PaginationResponse> {
    return await this.teamService.searchUsersDetails(
      req.companyId,
      search,
      limit,
      page
    );
  }

  @Put("/team/revoke-invite/:userId")
  async revokeInvite(
    @Req() req: UserRequest,
    @Param("userId") userId: string
  ): Promise<any> {
    return await this.teamService.revokeInvite(req.companyId, userId);
  }

  @Post("/team/resend-invite/:userId")
  async resendInvite(
    @Req() req: UserRequest,
    @Param("userId") userId: string
  ): Promise<any> {
    return await this.teamService.resendInvite(req.companyId, userId);
  }

  @Put("/team/settings-edit")
  async editOrganizationSettings(
    @Req() req: UserRequest,
    @Body() body: EditOrganizationRequest
  ): Promise<any> {
    return await this.teamService.editOrganizationSetting(req.companyId, body);
  }
}
