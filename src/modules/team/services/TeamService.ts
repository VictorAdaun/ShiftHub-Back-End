import { Service, Inject } from 'typedi'
import { AuthRepository } from '../../user/repository/AuthRepository'
import { CompanyRepository } from '../../user/repository/CompanyRepository'
import { NotFoundError } from 'routing-controllers'
import { AuthService } from '../../user/services/AuthService'
import { EditOrganizationRequest } from '../types/TeamRequest'
import { Company } from '@prisma/client'
import { CompanyResponse, CompanySchema } from '../types/TeamTypes'

@Service()
export class TeamService {
  @Inject()
  private authRepo: AuthRepository

  @Inject()
  private authService: AuthService

  @Inject()
  private companyRepo: CompanyRepository

  async pendingInvites(companyId: string): Promise<any> {
    const company = await this.companyRepo.findCompanyById(companyId)
    if (!company) {
      throw new NotFoundError(
        'Organization does not exist. Kindly contact support'
      )
    }

    let data: any[] = []

    const users = await this.authRepo.findInactiveUsers(companyId)
    if (users) {
      data = users.map((user) => {
        return {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          employeeType: user.userType,
          role: user.role.roleTitle,
          status: user.verificationCode ? 'Pending' : 'Revoked',
        }
      })
    }

    return data
  }

  async revokeInvite(companyId: string, userId: string): Promise<any> {
    const user = await this.authRepo.findUserByIdOrThrow(userId)
    if (user.companyId !== companyId) {
      throw new NotFoundError('User does not exist. Kindly contact support')
    }

    if (user.isActive) {
      throw new NotFoundError('Unable to revoke invitation for active user')
    }

    await this.authRepo.updateUser(
      {
        verificationCode: null,
        verificationCodeCreatedAt: null,
      },
      user.email
    )

    return await this.pendingInvites(companyId)
  }

  async resendInvite(companyId: string, userId: string): Promise<any> {
    const user = await this.authRepo.findUserByIdOrThrow(userId)
    if (user.companyId !== companyId) {
      throw new NotFoundError('User does not exist. Kindly contact support')
    }

    if (user.isActive) {
      throw new NotFoundError('Unable to resend invitation for active user')
    }

    await this.authService.sendEmailVerification(user)
    return {
      message: 'Invitation sent successfully',
    }
  }

  async getDetails(companyId: string): Promise<any> {
    const company = await this.companyRepo.findCompanyById(companyId)
    if (!company) {
      throw new NotFoundError(
        'Organization does not exist. Kindly contact support'
      )
    }

    const activeEmployee = await this.authRepo.findActiveUsers(companyId)
    const allEmployees = await this.authRepo.findAllCompanyUsers(companyId)
    const data = {
      activeEmployee: activeEmployee ? activeEmployee.length : 0,
      employeeCount: allEmployees ? allEmployees.length : 0,
    }

    return {
      message: 'Dashboard retrieved successfully',
      data,
    }
  }

  async editOrganizationSetting(
    companyId: string,
    body: EditOrganizationRequest
  ): Promise<any> {
    const company = await this.companyRepo.findCompanyById(companyId)
    if (!company) {
      throw new NotFoundError(
        'Organization does not exist. Kindly contact support'
      )
    }

    let data: any = {}

    if (body.companyAddress) data.address = body.companyAddress
    if (body.companyName) data.companyName = body.companyName
    if (body.scheduleStartDay) data.scheduleStartDay = body.scheduleStartDay

    await this.companyRepo.updateCompany(data, companyId)

    return await this.getCompanyDetails(companyId)
  }

  async getCompanyDetails(companyId: string): Promise<CompanyResponse> {
    const company = await this.companyRepo.findCompanyById(companyId)
    if (!company) {
      throw new NotFoundError(
        'Organization does not exist. Kindly contact support'
      )
    }

    return {
      message: 'Company retrieved successfully',
      company: companySchema(company),
    }
  }
}

function companySchema(company: Company): CompanySchema {
  return {
    id: company.id,
    name: company.name,
    address: company.address,
    startDate: company.scheduleStartDay,
  }
}
