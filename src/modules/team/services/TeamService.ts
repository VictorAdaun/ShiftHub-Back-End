import { Service, Inject } from "typedi";
import { AuthRepository } from "../../user/repository/AuthRepository";
import {
  CompanyDepartmentRepository,
  CompanyRepository,
} from "../../user/repository/CompanyRepository";
import { NotFoundError } from "routing-controllers";
import { AuthService } from "../../user/services/AuthService";
import { EditOrganizationRequest } from "../types/TeamRequest";
import { Company, User } from "@prisma/client";
import {
  CompanyResponse,
  CompanySchema,
  DepartmentSchema,
  RoleSchema,
  UserSchema,
} from "../types/TeamTypes";
import { CompanyDepartmentAndRole } from "../../user/types/AuthTypes";
import { skip } from "node:test";
import { ScheduleRepository } from "../../schedule/repository/ScheduleRepository";
import { PaginationResponse, paginate } from "../../../utils/request";
import { schemaToUser } from "../../admin/services/AdminService";
import dayjs from "dayjs";
import { getHourStringDifference } from "../../../utils/formatDate";
import { PaginatedResponse } from "../../../core/pagination";

@Service()
export class TeamService {
  @Inject()
  private authRepo: AuthRepository;

  @Inject()
  private authService: AuthService;

  @Inject()
  private companyRepo: CompanyRepository;

  @Inject()
  private scheduleRepo: ScheduleRepository;

  @Inject()
  private companyDepartmentRepo: CompanyDepartmentRepository;

  async pendingInvites(
    companyId: string,
    limit?: number,
    page?: number
  ): Promise<any> {
    const company = await this.companyRepo.findCompanyById(companyId);
    if (!company) {
      throw new NotFoundError(
        "Organization does not exist. Kindly contact support"
      );
    }

    limit = limit ? limit : 10;
    page = page ? page : 1;
    const skip = page ? (page - 1) * limit : 1 * limit;

    let data: any[] = [];

    const users = await this.authRepo.findInactiveUsers(companyId, limit, skip);
    if (users) {
      data = users.map((user) => {
        return {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          employeeType: user.userType,
          role: user.role.roleTitle,
          status: user.verificationCode ? "Pending" : "Revoked",
        };
      });
    }

    return data;
  }

  async revokeInvite(companyId: string, userId: string): Promise<any> {
    const user = await this.authRepo.findUserByIdOrThrow(userId);
    if (user.companyId !== companyId) {
      throw new NotFoundError("User does not exist. Kindly contact support");
    }

    if (user.isActive) {
      throw new NotFoundError("Unable to revoke invitation for active user");
    }

    await this.authRepo.updateUser(
      {
        verificationCode: null,
        verificationCodeCreatedAt: null,
      },
      user.email
    );

    return await this.pendingInvites(companyId);
  }

  async resendInvite(companyId: string, userId: string): Promise<any> {
    const user = await this.authRepo.findUserByIdOrThrow(userId);
    if (user.companyId !== companyId) {
      throw new NotFoundError("User does not exist. Kindly contact support");
    }

    if (user.isActive) {
      throw new NotFoundError("Unable to resend invitation for active user");
    }

    await this.authService.sendEmailVerification(user, user.company.name);
    return {
      message: "Invitation sent successfully",
    };
  }

  async getCountDetails(companyId: string): Promise<any> {
    const company = await this.companyRepo.findCompanyById(companyId);
    if (!company) {
      throw new NotFoundError(
        "Organization does not exist. Kindly contact support"
      );
    }

    const activeEmployee = await this.authRepo.countActiveUsers(companyId);
    const allEmployees = await this.authRepo.countAllCompanyUsers(companyId);
    const allShifts = await this.scheduleRepo.countAllSchedules();
    const shiftCoverage = 0;

    const data = {
      activeEmployee,
      allEmployees,
      allShifts,
      shiftCoverage,
    };

    return {
      message: "Dashboard retrieved successfully",
      data,
    };
  }

  async searchName(
    name: string,
    companyId: string,
    limit?: number,
    page?: number
  ): Promise<any> {
    const company = await this.companyRepo.findCompanyById(companyId);
    if (!company) {
      throw new NotFoundError(
        "Organization does not exist. Kindly contact support"
      );
    }

    limit = limit ? limit : 10;
    page = page ? page : 1;
    const skip = page ? (page - 1) * limit : 1 * limit;

    const employees = await this.authRepo.searchUsers(
      companyId,
      name,
      limit,
      skip
    );
    const data = employees.map((user) => schemaToUser(user));

    return {
      message: "Dashboard retrieved successfully",
      data: paginate(data, page, limit, data.length),
    };
  }

  async usersDetails(
    companyId: string,
    limit?: number,
    page?: number
  ): Promise<PaginationResponse> {
    const company = await this.companyRepo.findCompanyById(companyId);
    if (!company) {
      throw new NotFoundError(
        "Organization does not exist. Kindly contact support"
      );
    }

    limit = limit ? limit : 10;
    page = page ? page : 1;
    const skip = page ? (page - 1) * limit : 1 * limit;

    const activeEmployees = await this.authRepo.findActiveUsers(
      companyId,
      limit,
      skip
    );
    let userDashboardDetails: any[] = [];

    if (!activeEmployees) {
      userDashboardDetails = [];
    } else {
      for (const employee of activeEmployees) {
        const data = await this.scheduleRepo.findAllUserSchedule(employee.id);
        const usersDetails = schemaToUser(employee);
        let averageShiftHours = 0;
        if (data)
          for (const schedule of data) {
            averageShiftHours += getHourStringDifference(
              schedule.schedulePeriodDemand.startTime,
              schedule.schedulePeriodDemand.endTime
            );
          }
        const dataLength = data ? data.length : 0;
        userDashboardDetails.push({
          ...usersDetails,
          shifts: dataLength,
          sickDays: 0,
          averageShiftHours: averageShiftHours / dataLength,
        });
      }
    }
    return {
      message: "Dashboard retrieved successfully",
      data: paginate(
        userDashboardDetails,
        page,
        limit,
        userDashboardDetails.length
      ),
    };
  }

  async searchUsersDetails(
    companyId: string,
    name: string,
    limit?: number,
    page?: number
  ): Promise<PaginationResponse> {
    const company = await this.companyRepo.findCompanyById(companyId);
    if (!company) {
      throw new NotFoundError(
        "Organization does not exist. Kindly contact support"
      );
    }

    limit = limit ? limit : 10;
    page = page ? page : 1;
    const skip = page ? (page - 1) * limit : 1 * limit;

    const activeEmployees = await this.authRepo.searchUsers(
      companyId,
      name,
      limit,
      skip
    );

    let userDashboardDetails: any[] = [];

    if (!activeEmployees) {
      userDashboardDetails = [];
    } else {
      for (const employee of activeEmployees) {
        const data = await this.scheduleRepo.findAllUserSchedule(employee.id);
        const usersDetails = schemaToUser(employee);
        let averageShiftHours = 0;
        if (data)
          for (const schedule of data) {
            averageShiftHours += getHourStringDifference(
              schedule.schedulePeriodDemand.startTime,
              schedule.schedulePeriodDemand.endTime
            );
          }
        const dataLength = data ? data.length : 0;
        userDashboardDetails.push({
          ...usersDetails,
          shifts: dataLength,
          sickDays: 0,
          averageShiftHours:
            averageShiftHours > 0 ? averageShiftHours / dataLength : 0,
        });
      }
    }
    return {
      message: "Dashboard retrieved successfully",
      data: paginate(
        userDashboardDetails,
        page,
        limit,
        userDashboardDetails.length
      ),
    };
  }

  async getActiveUsers(
    companyId: string,
    limit?: number,
    page?: number
  ): Promise<any> {
    const company = await this.companyRepo.findCompanyById(companyId);
    if (!company) {
      throw new NotFoundError(
        "Organization does not exist. Kindly contact support"
      );
    }

    limit = limit ? limit : 10;
    page = page ? page : 1;
    const skip = page ? (page - 1) * limit : 1 * limit;

    let data: UserSchema[] = [];
    const activeEmployee = await this.authRepo.findActiveUsers(
      companyId,
      limit,
      skip
    );

    if (activeEmployee) {
      data = activeEmployee.map((employee) => schemaToUser(employee));
    }

    return {
      message: "Active users retrieved successfully",
      data,
    };
  }

  async editOrganizationSetting(
    companyId: string,
    body: EditOrganizationRequest
  ): Promise<any> {
    const company = await this.companyRepo.findCompanyById(companyId);
    if (!company) {
      throw new NotFoundError(
        "Organization does not exist. Kindly contact support"
      );
    }

    let data: any = {};

    if (body.companyAddress) data.address = body.companyAddress;
    if (body.companyName) data.companyName = body.companyName;
    if (body.scheduleStartDay) data.scheduleStartDay = body.scheduleStartDay;

    await this.companyRepo.updateCompany(data, companyId);

    return await this.getCompanyDetails(companyId);
  }

  async getCompanyDetails(companyId: string): Promise<CompanyResponse> {
    const company = await this.companyRepo.findCompanyById(companyId);
    if (!company) {
      throw new NotFoundError(
        "Organization does not exist. Kindly contact support"
      );
    }

    return {
      message: "Company retrieved successfully",
      company: companySchema(company),
    };
  }

  async getTeamDepartments(companyId: string): Promise<any> {
    const company = await this.companyRepo.findCompanyById(companyId);
    if (!company) {
      throw new NotFoundError(
        "Organization does not exist. Kindly contact support"
      );
    }

    let data: DepartmentSchema[] = [];

    const departments =
      await this.companyDepartmentRepo.findCompanyDepartmentByCompanyId(
        company.id
      );
    if (departments) {
      data = departments.map((department) => departmentSchema(department));
    }

    return {
      message: "Departments retrieved successfully",
      data,
    };
  }
}

function schemaToUserDashboard(user: User): any {
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
}

function departmentSchema(
  department: CompanyDepartmentAndRole
): DepartmentSchema {
  let roles: RoleSchema[] = [];
  if (department.companyRole) {
    department.companyRole.map((role) =>
      roles.push({
        id: role.id,
        title: role.roleTitle,
      })
    );
  }
  return {
    id: department.id,
    title: department.departmentTitle,
    roles,
  };
}

function companySchema(company: Company): CompanySchema {
  return {
    id: company.id,
    name: company.name,
    address: company.address,
    startDate: company.scheduleStartDay,
  };
}
