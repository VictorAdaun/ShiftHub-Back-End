import { USER_TYPE, User } from "@prisma/client";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { Inject, Service } from "typedi";

import { UUIDService } from "../../../common/services/UUIDService";
import config from "../../../config";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../../core/errors/errors";
import { logger } from "../../../core/logging/logger";
import {
  AuthRepository,
  SecurityRepository,
} from "../repository/AuthRepository";
import {
  EditUserDetails,
  GoogleLoginRequest,
  GoogleSignupRequest,
  InviteTeammatesRequest,
  LoginRequest,
  VerifyEmailRequest,
} from "../types/AuthRequest";
import {
  addTeammatesResponse,
  createUserWithPasswordType,
  loginResponse,
  resetPasswordResponse,
  signupResponse,
  updateUserType,
} from "../types/AuthTypes";
import {
  CompanyDepartmentRepository,
  CompanyRepository,
  CompanyRoleRepository,
} from "../repository/CompanyRepository";
import {
  changePasswordEmail,
  sendEmail,
  sendWelcomeEmail,
} from "../../../utils/sendMail";
import { schemaToUser } from "../../admin/services/AdminService";
import { PaginatedResponse } from "../../../core/pagination";
import { PaginationResponse, paginate } from "../../../utils/request";

@Service()
export class AuthService {
  @Inject()
  private authRepo: AuthRepository;

  @Inject()
  private companyRepo: CompanyRepository;

  @Inject()
  private securityRepo: SecurityRepository;

  @Inject()
  private departmentRepo: CompanyDepartmentRepository;

  @Inject()
  private roleRepo: CompanyRoleRepository;

  @Inject()
  private uuid: UUIDService;

  url: "sample url";

  async createUserWithPassword(
    userDetails: createUserWithPasswordType
  ): Promise<signupResponse> {
    const {
      email,
      password,
      confirmPassword,
      fullName,
      companyName,
      companyAddress,
      scheduleStartDay,
      departments,
    } = userDetails;
    const userExists = await this.authRepo.findUserByEmail(email);

    if (userExists) {
      throw new ConflictError(
        "An account already exists with this email address. Please login."
      );
    }

    if (password !== confirmPassword) {
      throw new BadRequestError("Mismtached password");
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const [firstName, ...lastNameArray] = fullName.trim().split(/\s+/);
    const lastName = lastNameArray.join(" ");

    const company = await this.companyRepo.createCompany({
      name: companyName,
      address: companyAddress,
      scheduleStartDay,
    });

    const managerDepartment = await this.departmentRepo.createCompanyDepartment(
      {
        company: {
          connect: {
            id: company.id,
          },
        },
        departmentTitle: "Admin",
      }
    );
    const managerRole = await this.roleRepo.createDepartmentRole({
      company: {
        connect: {
          id: company.id,
        },
      },
      department: {
        connect: {
          id: managerDepartment.id,
        },
      },
      roleTitle: "Admin",
    });

    departments.map(async (department) => {
      const createDepartment =
        await this.departmentRepo.createCompanyDepartment({
          company: {
            connect: {
              id: company.id,
            },
          },
          departmentTitle: department.departmentName,
        });
      for (const role of department.roles) {
        await this.roleRepo.createDepartmentRole({
          company: {
            connect: {
              id: company.id,
            },
          },
          department: {
            connect: {
              id: createDepartment.id,
            },
          },
          roleTitle: role,
        });
      }
    });

    const user = await this.authRepo.createUser({
      email: email.toLowerCase(),
      password: hash,
      firstName,
      lastName,
      fullName,
      userType: USER_TYPE.ADMIN,
      role: {
        connect: {
          id: managerRole.id,
        },
      },
      company: {
        connect: {
          id: company.id,
        },
      },
      isActive: true,
    });

    //Send event to segment with email verification process
    await this.sendEmailVerification(user, company.name);

    const userQuestions = await this.securityRepo.createSecurityFiels(user.id);

    return {
      message: "Check your email for a one time password",
    };
  }

  async inviteTeammates(
    teammate: InviteTeammatesRequest,
    companyId: string
  ): Promise<addTeammatesResponse> {
    let data: any[] = [];
    const company = await this.companyRepo.findCompanyById(companyId);
    if (!company) {
      throw new NotFoundError("Company not found");
    }
    const checkEmail = await this.authRepo.findUserByEmailInCompany(
      teammate.email,
      companyId
    );

    if (checkEmail) {
      throw new ConflictError("Teammate already exisits in company");
    }

    const [firstName, ...lastNameArray] = teammate.fullName.trim().split(/\s+/);
    const lastName = lastNameArray.join(" ");
    const password = Math.random().toString(36).slice(2);

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const createdUser = await this.authRepo.createUser({
      email: teammate.email.toLowerCase(),
      password: hash,
      firstName,
      lastName,
      fullName: teammate.fullName,
      userType: teammate.employeeType,
      isAdmin: teammate.employeeType == "ADMIN" ? true : false,
      company: {
        connect: {
          id: companyId,
        },
      },
      role: {
        connect: {
          id: teammate.role,
        },
      },
    });
    await this.sendEmailVerification(
      createdUser,
      company.name,
      password,
      "teammateInvite"
    );

    return {
      message: "Email sent successfully",
    };
  }

  async changeUserPassword(
    userId: string,
    password: string,
    confirmPassword: string
  ): Promise<resetPasswordResponse> {
    const user = await this.authRepo.findUserByIdOrThrow(userId);

    if (!user.password) {
      throw new NotFoundError(
        "You do not have a password set. Please logout and use the forgot password option to set a new password."
      );
    }

    if (password !== confirmPassword) {
      throw new BadRequestError("Mismatched password");
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    await this.authRepo.updateUser(
      {
        password: hash,
        passwordToken: null,
        updatedAt: new Date(),
      },
      user.email
    );

    return {
      message: "Password reset successful",
    };
  }

  async login(
    userDetails: LoginRequest,
    includeId: boolean = false
  ): Promise<loginResponse> {
    const { email, password } = userDetails;
    const userExists = await this.authRepo.findUserByEmail(email);

    if (!userExists) {
      throw new NotFoundError("No account exists for this email.");
    }

    if (userExists.isBlacklisted || userExists.deletedAt) {
      throw new NotFoundError("Kindly contact your organization adminstration");
    }

    //TODO IF USER EXISTS BUT NO PASSWORD
    if (!userExists.password) {
      await this.generatePasswordResetCreateLink(
        email,
        userExists.id,
        userExists.firstName
      );

      throw new UnauthorizedError(
        "Seems you haven't created a password for your account. Please check your email for a password creation link.",
        {
          nextStep: "createPassword",
        }
      );
    }

    const verify = await bcrypt.compare(password, userExists.password);
    if (!verify) {
      throw new NotFoundError("Incorrect password. Please try again.");
    }

    if (!userExists.emailVerified) {
      await this.sendEmailVerification(userExists, userExists.company.name);
      // this.segmentEvents.emit('loginError', email, 'Unverified email.', email)
      throw new UnauthorizedError(
        "Please check your email for a link to verify your email.",
        { nextStep: "verifyEmail" }
      );
    }

    const token = await this.generateToken({ email });

    return {
      message: "login successful",
      email,
      fullName: userExists.fullName,
      token,
      userId: userExists.id,
      company: userExists.company.name,
      companyId: userExists.companyId,
      avatar: userExists.avatar,
      userType: userExists.userType,
    };
  }

  async resetPassword(email: string): Promise<resetPasswordResponse> {
    const user = await this.authRepo.findUserByEmail(email);
    if (!user) {
      throw new NotFoundError("No user with that email address found.");
    }

    await this.generatePasswordResetCreateLink(email, user.id, user.firstName);

    return {
      message: "Please check your email for a link to reset your password.",
    };
  }

  async resetPasswordComplete(
    password: string,
    confirmPassword: string,
    userId: string,
    passwordToken: string
  ): Promise<loginResponse> {
    const user = await this.authRepo.findUserByPasswordToken(
      passwordToken,
      userId
    );

    if (!user) {
      throw new UnauthorizedError("Invalid link. Please contact support");
    }

    if (password !== confirmPassword) {
      throw new BadRequestError("Mismatched password");
    }

    if (!user.passwordTokenCreatedAt) {
      throw new BadRequestError(
        "Cannot verify the account associated with this link. Please contact support."
      );
    }
    const currentTime = new Date();

    const timeDifference =
      currentTime.getTime() - user.passwordTokenCreatedAt.getTime();
    if (timeDifference >= 3600000) {
      const data = {
        email: user.email,
        firstName: user.firstName,
        url: `${this.url}/login/reset-password-complete?passwordToken=${passwordToken}&userId=${userId}`,
      };

      const mailContext = {
        data,
      };
      await changePasswordEmail(mailContext);
      console.log(mailContext);

      throw new UnauthorizedError(
        "Link is no longer valid. A new link has been sent to your email."
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    await this.authRepo.updateUser(
      {
        password: hash,
        passwordToken: null,
        updatedAt: new Date(),
      },
      user.email
    );

    const token = await this.generateToken({ email: user.email });

    return {
      message: "Password reset successful",
      userId,
      email: user.email,
      fullName: user.fullName,
      token,
      avatar: user.avatar,
      userType: user.userType,
      company: user.company.name,
      companyId: user.companyId,
    };
  }

  async checkGoogleLogin(
    body: GoogleLoginRequest
  ): Promise<loginResponse | null> {
    const googleClientId = config("GOOGLE_CLIENT_ID");
    const client = new OAuth2Client(googleClientId);

    try {
      const ticket = await client.verifyIdToken({
        idToken: body.token,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email)
        throw new Error("An error occurred login you in.");

      //Next step is to register or login user.
      const userExist = await this.authRepo.findUserByEmail(payload.email);

      if (userExist) {
        if (!userExist.emailVerified) {
          await this.sendEmailVerification(userExist, userExist.company.name);
          throw new UnauthorizedError(
            "Please check your email for a link to verify your email.",
            { nextStep: "verifyEmail" }
          );
        }
        const token = await this.generateToken({ email: userExist.email });
        return {
          message: "login successful",
          email: userExist.email,
          fullName: userExist.firstName,
          token,
          userId: userExist.id,
          company: userExist.company.name,
          avatar: userExist.avatar,
          userType: userExist.userType,
          companyId: userExist.companyId,
        };
      }
      return null;
    } catch (error) {
      logger.error(`Error with google Login. Error = ${error}`);
      throw new Error(
        "An error occurred logging you in with Google. Please try again."
      );
    }
  }

  async googleSignup(body: GoogleSignupRequest): Promise<loginResponse> {
    const googleClientId = config("GOOGLE_CLIENT_ID");
    const client = new OAuth2Client(googleClientId);

    try {
      const ticket = await client.verifyIdToken({
        idToken: body.token,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email)
        throw new Error("An error occurred login you in.");

      //Next step is to register or login user.
      const userExist = await this.authRepo.findUserByEmail(payload.email);
      if (userExist) {
        throw new ConflictError("An account exists with this email");
      }

      const company = await this.companyRepo.createCompany({
        name: body.companyName,
        address: body.companyAddress,
        scheduleStartDay: body.scheduleStartDay,
      });

      const managerDepartment =
        await this.departmentRepo.createCompanyDepartment({
          company: {
            connect: {
              id: company.id,
            },
          },
          departmentTitle: "Admin",
        });
      const managerRole = await this.roleRepo.createDepartmentRole({
        company: {
          connect: {
            id: company.id,
          },
        },
        department: {
          connect: {
            id: managerDepartment.id,
          },
        },
        roleTitle: "Manager",
      });

      body.departments.map(async (department) => {
        const createDepartment =
          await this.departmentRepo.createCompanyDepartment({
            company: {
              connect: {
                id: company.id,
              },
            },
            departmentTitle: department.departmentName,
          });
        for (const role of department.roles) {
          await this.roleRepo.createDepartmentRole({
            company: {
              connect: {
                id: company.id,
              },
            },
            department: {
              connect: {
                id: createDepartment.id,
              },
            },
            roleTitle: role,
          });
        }
      });

      const user = await this.authRepo.createUser({
        email: payload.email.toLowerCase(),
        firstName: payload.given_name || "",
        lastName: payload.family_name || "",
        fullName: `${payload.given_name || ""} ${payload.family_name || ""}`,
        emailVerified: true,
        userType: USER_TYPE.MANAGER,
        isActive: true,
        company: {
          connect: {
            id: company.id,
          },
        },
        role: {
          connect: {
            id: managerRole.id,
          },
        },
      });
      const token = await this.generateToken({ email: user.email });

      return {
        message: "signup successful",
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        token,
        userId: user.id,
        company: company.name,
        userType: user.userType,
        companyId: user.companyId,
      };
    } catch (error: any) {
      logger.error(`Error with google Login. Error = ${error}`);
      throw new Error(
        "An error occurred logging you in with Google. Please try again."
      );
    }
  }

  async sendEmailVerification(
    user: User,
    companyName: string,
    password?: string,
    type?: string
  ): Promise<void> {
    const currentTime = new Date();

    if (user.verificationCodeCreatedAt) {
      const timeDifference =
        currentTime.getTime() - user.verificationCodeCreatedAt.getTime();
      if (timeDifference < 3600000) return;
    }

    const verificationCode = await this.uuid.generateCustomNumber();
    await this.authRepo.updateUser(
      {
        verificationCode: verificationCode.toString(),
        verificationCodeCreatedAt: new Date(),
        updatedAt: new Date(),
      },
      user.email
    );

    // call event to send email verification
    const mailContext: any = {
      data: {
        fullName: user.fullName,
        url: `{this.url}/verify/${user.id}`,
        password,
        companyName,
        email: user.email,
        otp: verificationCode,
      },
      type,
    };

    console.log(mailContext.data);

    if (type) {
      await sendEmail(mailContext);
    } else {
      await sendWelcomeEmail(mailContext);
    }
  }

  async verifyUserEmail(body: VerifyEmailRequest): Promise<loginResponse> {
    const { code, email } = body;
    const user = await this.authRepo.findUserByEmail(email);
    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    const userVerified = await this.authRepo.findUserByVerificationCode(
      code,
      user.id
    );
    if (!userVerified) {
      throw new UnauthorizedError(
        "Cannot verify the account associated with this link. Please contact support."
      );
    }

    if (user.emailVerified) {
      throw new UnauthorizedError("Email has been verified already");
    }

    if (!user.verificationCodeCreatedAt) {
      throw new BadRequestError(
        "Cannot verify the account associated with this link. Please contact support."
      );
    }

    const currentTime = new Date();

    const timeDifference =
      currentTime.getTime() - user.verificationCodeCreatedAt.getTime();
    if (timeDifference >= 3600000) {
      await this.sendEmailVerification(user, user.company.name);
      throw new UnauthorizedError(
        "Link is no longer valid. A new link has been sent to your email."
      );
    }

    await this.authRepo.updateUser(
      {
        verificationCode: null,
        verificationCodeCreatedAt: null,
        emailVerified: true,
        updatedAt: new Date(),
        isActive: true,
      },
      user.email
    );

    const token = await this.generateToken({ email: user.email });
    return {
      message: "Email verification successful",
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      fullName: user.fullName,
      token,
      avatar: user.avatar,
      userType: user.userType,
      company: user.company.name,
    };
  }

  async getUser(userId: string, companyId: string): Promise<updateUserType> {
    const user = await this.authRepo.findUserByIdInCompany(userId, companyId);
    return {
      message: "User retrieved successfully",
      data: {
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        userType: user.userType,
      },
    };
  }

  private async generatePasswordResetCreateLink(
    email: string,
    userId: string,
    firstName: string
  ): Promise<resetPasswordResponse> {
    const passwordToken = await this.uuid.generateCustom(40);
    await this.authRepo.updateUser(
      {
        passwordToken,
        passwordTokenCreatedAt: new Date(),
        updatedAt: new Date(),
      },
      email
    );

    const data = {
      email: email,
      firstName: firstName,
      url: `${this.url}/login/reset-password-complete/?passwordToken=${passwordToken}&userId=${userId}`,
    };
    const mailContext = {
      data,
    };
    await changePasswordEmail(mailContext);
    console.log(mailContext);

    return {
      message: "Check your email for a reset password link",
    };
  }

  async generateToken(data: any): Promise<string> {
    return await jwt.sign(
      {
        data,
      },
      config("JWT_SECRET"),
      { expiresIn: "9000000h" }
    );
  }

  async editUserDetails(
    userId: string,
    body: EditUserDetails
  ): Promise<updateUserType> {
    const user = await this.authRepo.findUserByIdOrThrow(userId);

    let data: any = {};
    if (body.email) {
      const userExists = await this.authRepo.findUserByEmail(body.email);
      if (userExists) {
        throw new ConflictError("A user exists with the email address");
      }
      data.email = body.email;
    }
    if (body.firstName)
      data.firstName = body.firstName ? body.firstName : user.firstName;
    if (body.lastName)
      data.lastName = body.lastName ? body.lastName : user.lastName;

    if (body.avatar) data.avatar = body.avatar;
    if (body.location) data.location = body.location;

    if (body.alternativeEmail) data.alternativeEmail = body.alternativeEmail;

    data.fullName = `${data.firstName} ${data.lastName}`;
    const updatedUser = await this.authRepo.updateUser(data, user.email);

    const token = await this.generateToken({ email: updatedUser.email });
    return {
      message: "User information updated successfully",
      data: {
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        avatar: updatedUser.avatar,
        userType: updatedUser.userType,
        token,
      },
    };
  }

  async getActiveUsers(
    userId: string,
    companyId: string,
    limit?: number,
    page?: number
  ): Promise<PaginationResponse> {
    const user = await this.authRepo.findUserByIdOrThrow(userId);

    limit = limit ? limit : 10;
    page = page ? page : 1;
    const skip = page ? (page - 1) * limit : 1 * limit;

    const activeEmployee = await this.authRepo.findActiveEmployees(companyId);
    const data = activeEmployee
      ? activeEmployee.map((user) => schemaToUser(user))
      : [];

    return {
      message: "Users fetched successfully",
      data: paginate(data, page, limit, data.length),
    };
  }

  async verifyToken(token: string): Promise<User> {
    const decoded: any = await jwt.verify(token, config("JWT_SECRET"));

    if (!decoded.data.email) {
      throw new UnauthorizedError("User is not unathorized");
    }

    const user = await this.authRepo.findUserByEmail(decoded.data.email);

    if (!user) {
      throw new UnauthorizedError("Invalid user.");
    }
    return user;
  }

  async verifyAdminToken(token: string): Promise<User> {
    const decoded: any = await jwt.verify(token, config("JWT_SECRET"));

    if (!decoded.data.email) {
      throw new UnauthorizedError("User is not unathorized");
    }

    const user = await this.authRepo.findUserByEmail(decoded.data.email);

    if (!user) {
      throw new UnauthorizedError("Invalid user.");
    }

    if (user.userType == USER_TYPE.EMPLOYEE) {
      throw new UnauthorizedError("Invalid user.");
    }
    return user;
  }

  async testEmail(): Promise<any> {
    const data = {
      email: "culmunisti@gufum.com",
      firstName: "Bbeb",
      url: `${this.url}/login/reset-password-complete?passwordToken=dddd&userId=ddd`,
    };
    const mailContext = {
      data,
    };
    await changePasswordEmail(mailContext);
  }
}
