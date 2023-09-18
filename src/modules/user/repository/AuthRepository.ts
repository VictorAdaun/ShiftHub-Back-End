import { Prisma, User } from '@prisma/client'
import { Service } from 'typedi'

import { NotFoundError } from '../../../core/errors/errors'
import { prisma } from '../../../prismaClient'
import { UserRole, UserWithCompany } from '../types/AuthTypes'

@Service()
export class AuthRepository {
  async createUser(userDetails: Prisma.UserCreateInput): Promise<User> {
    return await prisma.user.create({
      data: userDetails,
    })
  }

  async findUserByEmail(email: string): Promise<UserWithCompany | null> {
    return await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
      },
      include: {
        company: true,
      },
    })
  }

  async findInactiveUsers(companyId: string): Promise<UserRole[] | null> {
    return await prisma.user.findMany({
      where: {
        AND: [{ isActive: false }, { companyId }, { deletedAt: null }],
      },
      include: {
        role: true,
      },
    })
  }

  async findActiveUsers(companyId: string): Promise<UserRole[] | null> {
    return await prisma.user.findMany({
      where: {
        AND: [{ isActive: true }, { companyId }, { deletedAt: null }],
      },
      include: {
        role: true,
      },
    })
  }

  async findAllCompanyUsers(companyId: string): Promise<UserRole[] | null> {
    return await prisma.user.findMany({
      where: {
        AND: [{ companyId }, { deletedAt: null }],
      },
      include: {
        role: true,
      },
    })
  }

  async findUserByEmailInCompany(
    email: string,
    companyId: string
  ): Promise<UserWithCompany | null> {
    return await prisma.user.findFirst({
      where: {
        AND: [{ email: email.toLowerCase() }, { companyId }],
      },
      include: {
        company: true,
      },
    })
  }

  async findUserByIdInCompany(id: string, companyId: string): Promise<User> {
    const user = await prisma.user.findFirst({
      where: {
        AND: [{ companyId }, { id }],
      },
    })
    if (!user) {
      throw new NotFoundError('User not found')
    }

    return user
  }

  async findUserByIdOrThrow(id: string): Promise<User> {
    const user = await prisma.user.findFirst({
      where: {
        id,
      },
    })
    if (!user) {
      throw new NotFoundError('User not found')
    }

    return user
  }

  async findUserByVerificationCode(
    verificationCode: string,
    id: string
  ): Promise<UserWithCompany | null> {
    return await prisma.user.findFirst({
      where: {
        AND: [{ verificationCode }, { id }],
      },
      include: {
        company: true,
      },
    })
  }

  async findUserByPasswordToken(
    passwordToken: string,
    id: string
  ): Promise<UserWithCompany | null> {
    return await prisma.user.findFirst({
      where: {
        AND: [{ passwordToken }, { id }],
      },
      include: {
        company: true,
      },
    })
  }

  async updateUser(body: Prisma.UserUpdateInput, email: string): Promise<User> {
    return await prisma.user.update({
      where: {
        email,
      },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    })
  }
}
