import { Request } from "express";
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
import { AuthService } from "../services/AuthService";
import {
  GoogleLoginRequest,
  LoginRequest,
  ResetPasswordCompleteRequest,
  ResetPasswordLinkRequest,
  SignupRequest,
  VerifyEmailRequest,
  UpdatePasswordRequest,
  InviteTeammatesRequest,
  GoogleSignupRequest,
  EditUserDetails,
} from "../types/AuthRequest";
import {
  loginResponse,
  resetPasswordResponse,
  signupResponse,
  updateUserType,
} from "../types/AuthTypes";
import { ImageUploadMiddleWare } from "../../../middlewares/ImageUploadMiddleware";
import { PaginationResponse } from "../../../utils/request";

@JsonController()
@Service()
export class AuthController {
  constructor(private authservice: AuthService) {}

  @Post("/auth/signup")
  async signup(
    @Req() req: Request,
    @Body() body: SignupRequest
  ): Promise<signupResponse> {
    return await this.authservice.createUserWithPassword(body);
  }

  @Post("/auth/invite/:companyId")
  async inviteTeammates(
    @Req() req: Request,
    @Body() body: InviteTeammatesRequest,
    @Param("companyId") companyId: string
  ): Promise<signupResponse> {
    return await this.authservice.inviteTeammates(body, companyId);
  }

  @Post("/auth/change-password")
  @UseBefore(UserAuthMiddleware)
  @OpenAPI({ security: [{ bearerAuth: [] }] })
  async updatePassword(
    @Req() req: UserRequest,
    @Body() body: UpdatePasswordRequest
  ): Promise<loginResponse> {
    return await this.authservice.changeUserPassword(
      req.userId,
      body.password,
      body.confirmPassword
    );
  }

  @Post("/auth/login")
  async login(
    @Req() req: Request,
    @Body() body: LoginRequest
  ): Promise<loginResponse> {
    return await this.authservice.login(body);
  }

  @Post("/auth/reset-password-link")
  async resetPasswordLink(
    @Req() req: Request,
    @Body() body: ResetPasswordLinkRequest
  ): Promise<resetPasswordResponse> {
    return await this.authservice.resetPassword(body.email);
  }

  @Post("/auth/reset-password/:passwordToken/:userId")
  async resetPasswordComplete(
    @Req() req: Request,
    @Body() body: ResetPasswordCompleteRequest,
    @Param("userId") userId: string,
    @Param("passwordToken") passwordToken: string
  ): Promise<loginResponse> {
    return await this.authservice.resetPasswordComplete(
      body.password,
      body.confirmPassword,
      userId,
      passwordToken
    );
  }

  @Post("/auth/email/verify")
  async verifyEmail(
    @Req() req: Request,
    @Body() body: VerifyEmailRequest
  ): Promise<loginResponse> {
    return await this.authservice.verifyUserEmail(body);
  }

  @Get("/auth/user/")
  @UseBefore(UserAuthMiddleware)
  @OpenAPI({ security: [{ bearerAuth: [] }] })
  async getUser(@Req() req: UserRequest): Promise<updateUserType> {
    return await this.authservice.getUser(req.userId, req.companyId);
  }

  @Post("/auth/google/login")
  async checkDetails(
    @Req() req: Request,
    @Body() body: GoogleLoginRequest
  ): Promise<loginResponse | null> {
    return await this.authservice.checkGoogleLogin(body);
  }

  @Post("/auth/google/signup")
  async googleLogin(
    @Req() req: Request,
    @Body() body: GoogleSignupRequest
  ): Promise<loginResponse> {
    return await this.authservice.googleSignup(body);
  }

  @Put("/auth/edit")
  @UseBefore(UserAuthMiddleware)
  @UseBefore(ImageUploadMiddleWare)
  @OpenAPI({ security: [{ bearerAuth: [] }] })
  async editUserDetails(
    @Req() req: UserRequest,
    @Body() body: EditUserDetails
  ): Promise<updateUserType> {
    return await this.authservice.editUserDetails(req.userId, body);
  }

  @Get("/company/users")
  @UseBefore(UserAuthMiddleware)
  async getActiveUsers(
    @Req() req: UserRequest,
    @QueryParam("limit") limit: number,
    @QueryParam("page") page: number
  ): Promise<PaginationResponse> {
    return await this.authservice.getActiveUsers(
      req.userId,
      req.companyId,
      limit,
      page
    );
  }

  @Get("/test/email")
  async testEmail(@Req() req: UserRequest): Promise<updateUserType> {
    return await this.authservice.testEmail();
  }

  //   @Post('/auth/google/login-admin')
  //   async googleLoginAdmin(
  //     @Req() req: Request,
  //     @Body() body: GoogleLoginRequest
  //   ): Promise<loginResponse> {
  //     return await this.authservice.googleLoginAdmin(body)
  //   }
}
