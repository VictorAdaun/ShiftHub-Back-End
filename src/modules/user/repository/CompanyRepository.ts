import { Prisma, Company, CompanyRole, CompanyDepartment } from '@prisma/client'
import { Service } from 'typedi'

import { NotFoundError } from '../../../core/errors/errors'
import { prisma } from '../../../prismaClient'
import { compare } from 'bcrypt'
import { CompanyDepartmentAndRole } from '../types/AuthTypes'

@Service()
export class CompanyRepository {
  async createCompany(
    companyDetails: Prisma.CompanyCreateInput
  ): Promise<Company> {
    return await prisma.company.create({
      data: companyDetails,
    })
  }

  async findCompanyById(id: string): Promise<Company | null> {
    return await prisma.company.findFirst({
      where: {
        id,
      },
    })
  }

  async findUsersInCompany(id: string): Promise<Company | null> {
    return await prisma.company.findFirst({
      where: {
        id,
      },
      include: {
        user: true,
      },
    })
  }

  async findCompanyByIdOrThrow(id: string): Promise<Company> {
    const company = await prisma.company.findFirst({
      where: {
        id,
      },
    })
    if (!company) {
      throw new NotFoundError('Company not found')
    }

    return company
  }

  async updateCompany(
    body: Prisma.CompanyUpdateInput,
    id: string
  ): Promise<Company> {
    return await prisma.company.update({
      where: {
        id,
      },
      data: {
        ...body,
      },
    })
  }
}

@Service()
export class CompanyDepartmentRepository {
  async createCompanyDepartment(
    companyDepartmentDetails: Prisma.CompanyDepartmentCreateInput
  ): Promise<CompanyDepartment> {
    return await prisma.companyDepartment.create({
      data: companyDepartmentDetails,
    })
  }

  async findCompanyDepartmentById(
    id: string
  ): Promise<CompanyDepartmentAndRole | null> {
    return await prisma.companyDepartment.findFirst({
      where: {
        id,
      },
      include: {
        companyRole: true,
      },
    })
  }

  async findCompanyDepartmentByCompanyId(
    id: string
  ): Promise<CompanyDepartmentAndRole[] | null> {
    return await prisma.companyDepartment.findMany({
      where: {
        company: {
          id,
        },
      },
      include: {
        companyRole: true,
      },
    })
  }

  async findCompanyDepartmentByIdOrThrow(
    id: string
  ): Promise<CompanyDepartment> {
    const companyDepartment = await prisma.companyDepartment.findFirst({
      where: {
        id,
      },
    })
    if (!companyDepartment) {
      throw new NotFoundError('CompanyDepartment not found')
    }

    return companyDepartment
  }

  async updateCompanyDepartment(
    body: Prisma.CompanyDepartmentUpdateInput,
    id: string
  ): Promise<CompanyDepartment> {
    return await prisma.companyDepartment.update({
      where: {
        id,
      },
      data: {
        ...body,
      },
    })
  }
}

@Service()
export class CompanyRoleRepository {
  async createDepartmentRole(
    departmentRoleDetails: Prisma.CompanyRoleCreateInput
  ): Promise<CompanyRole> {
    return await prisma.companyRole.create({
      data: departmentRoleDetails,
    })
  }

  async findDepartmentRoleById(id: string): Promise<CompanyRole | null> {
    return await prisma.companyRole.findFirst({
      where: {
        id,
      },
    })
  }

  async findDepartmentRoleByIdOrThrow(id: string): Promise<CompanyRole> {
    const companyRole = await prisma.companyRole.findFirst({
      where: {
        id,
      },
    })
    if (!companyRole) {
      throw new NotFoundError('Role not found')
    }

    return companyRole
  }

  async updateDepartmentRole(
    body: Prisma.CompanyRoleUpdateInput,
    id: string
  ): Promise<CompanyRole> {
    return await prisma.companyRole.update({
      where: {
        id,
      },
      data: {
        ...body,
      },
    })
  }
}
