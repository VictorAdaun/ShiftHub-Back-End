import {
  Body,
  Get,
  JsonController,
  Param,
  Post,
  Put,
  Req,
  UseBefore,
} from 'routing-controllers'
import { OpenAPI } from 'routing-controllers-openapi'
import { Service } from 'typedi'
import {
  UserAuthMiddleware,
  UserRequest,
} from '../../../middlewares/UserAuthMiddleware'
import { TeamService } from '../services/TeamService'
import { AdminAuthMiddleware } from '../../../middlewares/AdminAuthMiddleware'
import { EditOrganizationRequest } from '../types/TeamRequest'

@JsonController()
@UseBefore(AdminAuthMiddleware)
@OpenAPI({ security: [{ bearerAuth: [] }] })
@Service()
export class TeamController {
  constructor(private teamService: TeamService) {}

  @Get('/team/invites')
  async getTeamInvites(@Req() req: UserRequest): Promise<any> {
    return await this.teamService.pendingInvites(req.companyId)
  }

  @Get('/team/dashboard')
  async getTeamDetails(@Req() req: UserRequest): Promise<any> {
    return await this.teamService.getDetails(req.companyId)
  }

  @Put('/team/revoke-invite/:userId')
  async revokeInvite(
    @Req() req: UserRequest,
    @Param('userId') userId: string
  ): Promise<any> {
    return await this.teamService.revokeInvite(req.companyId, userId)
  }

  @Post('/team/resend-invite/:userId')
  async resendInvite(
    @Req() req: UserRequest,
    @Param('userId') userId: string
  ): Promise<any> {
    return await this.teamService.resendInvite(req.companyId, userId)
  }

  @Put('/team/settings-edit')
  async editOrganizationSettings(
    @Req() req: UserRequest,
    @Body() body: EditOrganizationRequest
  ): Promise<any> {
    return await this.teamService.editOrganizationSetting(req.companyId, body)
  }
}
