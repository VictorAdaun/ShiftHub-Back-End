import {
  Company,
  CompanyRole,
  DAY_OF_WEEK,
  USER_TYPE,
  User,
} from '@prisma/client'

export type createUserType = {
  email: string
  fullName: string
  avatar: string | null
  userType: USER_TYPE
}

export type createUserWithPasswordType = {
  email: string
  fullName: string
  password: string
  confirmPassword: string
  companyName: string
  companyAddress: string
  scheduleStartDay: DAY_OF_WEEK
  departments: createDepartments[]
}

export type inviteTeammates = {
  fullName: string
  companyId: string
  email: string
  role: string
  employeeType: USER_TYPE
}

export type createDepartments = {
  departmentName: string
  roles: string[]
}

export type signupResponse = {
  message: string
}

export type UserWithCompany = User & {
  company: Company
}

export type UserRole = User & {
  role: CompanyRole
}

export type addTeammatesResponse = {
  message: string
  data?: string[]
}

export type createUserPopupType = {
  email: string
  firstName: string
  lastName: string
}

export type loginResponse = {
  message: string
  email: string
  fullName: string
  token: string
  userId: string
  company: string
  avatar?: string | null
  userType: USER_TYPE
}

export type resetPasswordResponse = {
  message: string
}
