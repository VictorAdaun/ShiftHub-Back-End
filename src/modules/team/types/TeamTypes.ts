import { Company, User } from '@prisma/client'

export type CompanyMembers = Company & {
  user: User[]
}
