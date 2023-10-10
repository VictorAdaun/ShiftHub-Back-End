import { Company, DAY_OF_WEEK, User } from '@prisma/client'

export type CompanyMembers = Company & {
  user: User[]
}

export type CompanyResponse = {
  message: string
  company: CompanySchema
}

export type CompanySchema = {
  id: string
  name: string
  address: string
  startDate: DAY_OF_WEEK
}

export type UserSchema = {
  id: string
  fullName: string
  avatar: string | null
  email: string
}
