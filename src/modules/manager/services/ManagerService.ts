import { Inject, Service } from "typedi";
import {
  EmployeeTaskRepository,
  TaskListRepository,
  TaskRepository,
} from "../../task/repository/TaskRepository";
import { PRIORITY, TASK_ASSIGNED, TASK_STATUS, Task } from "@prisma/client";
import {
  CreateDraftTaskRequest,
  CreateTaskRequest,
} from "../../task/types/TaskRequest";
import { AuthRepository } from "../../user/repository/AuthRepository";
import { NotFoundError } from "../../../core/errors/errors";
import {
  EmployeeTaskDetails,
  FullTaskDetails,
  SingleTaskResponse,
  TaskDetails,
  TaskMember,
  TaskNote,
  TaskResponse,
  UserTaskResponse,
} from "../../task/types/TaskTypes";
import { CompanyRepository } from "../../user/repository/CompanyRepository";
import { CollaboratorTask } from "../../task/types/TaskTypes";
import { UserRole, UserSchema } from "../../user/types/AuthTypes";

@Service()
export class ManagerService {
  @Inject()
  private taskRepo: TaskRepository;

  @Inject()
  private authRepo: AuthRepository;

  @Inject()
  private companyRepo: CompanyRepository;

  @Inject()
  private listRepo: TaskListRepository;

  @Inject()
  private employeeTaskRepo: EmployeeTaskRepository;

  async deleteUser(
    employeeId: string,
    userId: string,
    companyId: string
  ): Promise<any> {
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

  async blacklistUser(
    employeeId: string,
    userId: string,
    companyId: string
  ): Promise<any> {
    const user = await this.authRepo.findUserByIdInCompany(userId, companyId);
    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    const employee = await this.authRepo.findUserByIdOrThrow(employeeId);
    if (!employee || employee.companyId !== companyId) {
      throw new NotFoundError("Employee does not exist");
    }

    await this.authRepo.updateUser(
      {
        isBlacklisted: true,
      },
      employee.email
    );
    return {
      message: "User blacklisted successfully",
      data: await this.getAllCompanyUser(userId, companyId),
    };
  }

  async getAllCompanyUser(userId: string, companyId: string): Promise<any> {
    const user = await this.authRepo.findUserByIdInCompany(userId, companyId);
    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    let data: UserSchema[] = [];
    const employees = await this.authRepo.findAllCompanyUsers(companyId);
    data = employees ? employees.map((user) => schemaToUser(user)) : [];

    return data;
  }
}

const schemaToUser = (user: UserRole): UserSchema => {
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
    role: user.role.roleTitle,
    emailVerified: user.emailVerified,
  };
};
