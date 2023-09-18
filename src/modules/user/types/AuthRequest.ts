import { DAY_OF_WEEK, USER_TYPE } from '@prisma/client'
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator'
import { validationMetadatasToSchemas } from 'class-validator-jsonschema'

export class LoginRequest {
  @IsEmail()
  @IsString()
  email: string

  @IsString()
  password: string
}

export class GoogleLoginRequest {
  @IsString()
  token: string
}

export class GoogleSignupRequest {
  @IsString()
  token: string

  @IsString()
  @IsOptional()
  companyName: string

  @IsString()
  @IsOptional()
  companyAddress: string

  @IsEnum(DAY_OF_WEEK)
  @IsOptional()
  scheduleStartDay: DAY_OF_WEEK

  @IsArray()
  @IsOptional()
  departments: any[]
}

export class SignupRequest {
  @IsEmail()
  @IsString()
  email: string

  @IsString()
  fullName: string

  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string

  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  confirmPassword: string

  @IsString()
  companyName: string

  @IsString()
  companyAddress: string

  @IsEnum(DAY_OF_WEEK)
  scheduleStartDay: DAY_OF_WEEK

  @IsArray()
  departments: any[]
}

export class InviteTeammatesRequest {
  @IsString()
  fullName: string

  @IsEmail()
  email: string

  @IsString()
  role: string

  @IsEnum(USER_TYPE)
  employeeType: USER_TYPE
}

export class VerifyEmailRequest {
  @IsString()
  verifyText: string

  @IsString()
  identifier: string
}

export class ResetPasswordLinkRequest {
  @IsEmail()
  @IsString()
  email: string
}

export class ResetPasswordCompleteRequest {
  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string

  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  confirmPassword: string

  @IsString()
  passwordToken: string

  @IsString()
  identifier: string
}

export class SignupPopup {
  @IsEmail()
  @IsString()
  email: string

  @IsString()
  firstName: string

  @IsString()
  lastName: string
}

export class UpdatePasswordRequest {
  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string

  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  confirmPassword: string
}

const schemas = validationMetadatasToSchemas()
export default schemas
