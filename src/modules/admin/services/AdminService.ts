import { Inject, Service } from "typedi";
import {
  EmployeeTaskRepository,
  TaskListRepository,
  TaskRepository,
} from "../../task/repository/TaskRepository";
import bcrypt from "bcrypt";
import { STATUS, User } from "@prisma/client";
import {
  AuthRepository,
  SecurityRepository,
} from "../../user/repository/AuthRepository";
import { ConflictError, NotFoundError } from "../../../core/errors/errors";
import { CompanyRepository } from "../../user/repository/CompanyRepository";
import {
  MultipleUserResponse,
  UserResponse,
  UserRole,
  UserSchema,
} from "../../user/types/AuthTypes";
import {
  Pagination,
  PaginationResponse,
  paginate,
} from "../../../utils/request";
import { PaginatedResponse } from "../../../core/pagination";
import { SecurityQuestions } from "../types/AdminRequest";
import { BadRequestError } from "routing-controllers";
import { Questions } from "../types/AdminTypes";
import { TimeOffRepository } from "../../employee/repository/TimeOffRepository";
import { timeOffRequest } from "../../employee/services/EmployeeService";
import { NotficationService } from "../../employee/services/NotificationService";

@Service()
export class AdminService {
  @Inject()
  private taskRepo: TaskRepository;

  @Inject()
  private securityRepo: SecurityRepository;

  @Inject()
  private authRepo: AuthRepository;

  @Inject()
  private companyRepo: CompanyRepository;

  @Inject()
  private listRepo: TaskListRepository;

  @Inject()
  private employeeTaskRepo: EmployeeTaskRepository;

  @Inject()
  private timeOffRepo: TimeOffRepository;

  @Inject()
  private notificationService: NotficationService;

  async deleteUser(
    employeeId: string,
    userId: string,
    companyId: string
  ): Promise<PaginationResponse> {
    const user = await this.authRepo.findUserByIdInCompany(userId, companyId);
    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    const employee = await this.authRepo.findUserByIdOrThrow(employeeId);
    if (!employee || employee.companyId !== companyId) {
      throw new NotFoundError("Employee does not exist");
    }

    await this.authRepo.deleteUser(employeeId);
    return {
      message: "User deleted successfully",
      data: await this.getAllCompanyUser(userId, companyId),
    };
  }

  async toggleUserStatus(
    employeeId: string,
    userId: string,
    companyId: string
  ): Promise<UserResponse> {
    const user = await this.authRepo.findUserByIdInCompany(userId, companyId);
    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    const employee = await this.authRepo.findUserByIdOrThrow(employeeId);
    if (!employee || employee.companyId !== companyId) {
      throw new NotFoundError("Employee does not exist");
    }

    if (userId == employee.id) {
      throw new ConflictError("You cannot blacklist yourself");
    }

    const value = user.isBlacklisted ? false : true;

    const updatedUser = await this.authRepo.updateUser(
      {
        isBlacklisted: value,
      },
      employee.email
    );
    return {
      message: "User blacklisted successfully",
      data: schemaToUser(updatedUser),
    };
  }

  async getBlackListedUsers(
    userId: string,
    companyId: string,
    limit?: number,
    page?: number
  ): Promise<PaginationResponse> {
    const user = await this.authRepo.findUserByIdInCompany(userId, companyId);
    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    limit = limit ? limit : 10;
    page = page ? page : 1;
    const skip = page ? (page - 1) * limit : 1 * limit;

    const employees = await this.authRepo.findBlacklistedUsers(
      companyId,
      limit,
      skip
    );
    const data = employees ? employees.map((user) => schemaToUser(user)) : [];

    return {
      message: "User blacklisted successfully",
      data: paginate(data, page, limit, data.length),
    };
  }

  async getAllCompanyUser(
    userId: string,
    companyId: string,
    limit?: number,
    page?: number
  ): Promise<Pagination> {
    const user = await this.authRepo.findUserByIdInCompany(userId, companyId);
    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    limit = limit ? limit : 10;
    page = page ? page : 1;
    const skip = page ? (page - 1) * limit : 1 * limit;

    const employees = await this.authRepo.findAllCompanyUsers(
      companyId,
      limit,
      skip
    );
    const data = employees
      ? employees.map((user) => schemaToUserRole(user))
      : [];

    return paginate(data, page, limit, data.length);
  }

  async getSecurityQuestions(
    userId: string,
    companyId: string
  ): Promise<Questions> {
    const user = await this.authRepo.findUserByIdInCompany(userId, companyId);
    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    if (!user.password)
      throw new NotFoundError("Kindly set a password to proceed");

    let userQuestions = await this.securityRepo.findUserQuestions(userId);
    if (!userQuestions) {
      userQuestions = await this.securityRepo.createSecurityFiels(userId);
    }

    return {
      message: "question fetched successfully",
      data: {
        questionOne: userQuestions.questionOne,
        questionTwo: userQuestions.questionTwo,
      },
    };
  }

  async setSecurityQuestions(
    userId: string,
    companyId: string,
    body: SecurityQuestions
  ): Promise<Questions> {
    const user = await this.authRepo.findUserByIdInCompany(userId, companyId);
    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    if (!user.password)
      throw new NotFoundError("Kindly set a password to proceed");

    const verify = await bcrypt.compare(body.password, user.password);
    if (!verify) {
      throw new NotFoundError("Incorrect password. Please try again.");
    }

    if (
      (body.questionOne && !body.answerOne) ||
      (body.questionTwo && !body.answerTwo) ||
      (!body.questionOne && !body.questionTwo) ||
      (!body.answerOne && !body.answerTwo)
    ) {
      throw new BadRequestError("Incomplete details provided");
    }

    let userQuestions = await this.securityRepo.findUserQuestions(userId);
    if (!userQuestions) {
      userQuestions = await this.securityRepo.createSecurityFiels(userId);
    }

    const data: any = {};
    const salt = await bcrypt.genSalt(10);

    if (body.questionOne) data.questionOne = body.questionOne;
    if (body.questionTwo) data.questionTwo = body.questionTwo;
    if (body.answerOne)
      data.answerOne = await bcrypt.hash(body.answerOne, salt);
    if (body.answerTwo)
      data.answerTwo = await bcrypt.hash(body.answerTwo, salt);

    await this.securityRepo.updateQuestion(data, userQuestions.id);

    return {
      message: "question updated successfully",
      data: {
        questionOne: data.questionOne
          ? data.questionOne
          : userQuestions.questionOne,
        questionTwo: data.questionTwo
          ? data.questionTwo
          : userQuestions.questionTwo,
      },
    };
  }

  async viewTimeOffRequests(
    userId: string,
    companyId: string,
    status?: STATUS,
    limit?: number,
    page?: number
  ): Promise<PaginationResponse> {
    const user = await this.authRepo.findUserByIdInCompany(userId, companyId);
    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    limit = limit ? limit : 10;
    page = page ? page : 1;
    const skip = page ? (page - 1) * limit : 1 * limit;

    status = status ? status : "PENDING";

    const requests = await this.timeOffRepo.getAllTimeOffRequests(
      companyId,
      status,
      limit,
      skip
    );
    const data = requests.map((request) => timeOffRequest(request));

    return {
      message: "question fetched successfully",
      data: paginate(data, page, limit, data.length),
    };
  }

  async acceptOrRejectRequest(
    userId: string,
    companyId: string,
    requestId: string,
    status: boolean
  ): Promise<PaginationResponse> {
    const user = await this.authRepo.findUserByIdInCompany(userId, companyId);
    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    const request = await this.timeOffRepo.findById(requestId);
    if (!request) {
      throw new NotFoundError("Request does not exist");
    }

    if (request.status == "EXPIRED") {
      throw new NotFoundError("Expired requests cannot be updated");
    }

    await this.timeOffRepo.updateOne(requestId, {
      status: status ? STATUS.APPROVED : STATUS.DENIED,
    });

    await this.notificationService.timeOffResponse(requestId, userId);

    return await this.viewTimeOffRequests(userId, companyId, request.status);
  }
}

export const schemaToUser = (user: User): UserSchema => {
  return {
    id: user.id,
    fullName: user.fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatar: user.avatar,
    userType: user.userType,
    isAdmin: user.isActive,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    isBlacklisted: user.isBlacklisted,
  };
};

const schemaToUserRole = (user: UserRole): UserSchema => {
  return {
    id: user.id,
    fullName: user.fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatar: user.avatar,
    userType: user.userType,
    isAdmin: user.isActive,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    role: user.role.roleTitle,
    isBlacklisted: user.isBlacklisted,
  };
};
