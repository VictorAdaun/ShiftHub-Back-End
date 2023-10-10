import {
  DAY_OF_WEEK,
  SchedulePeriod,
  SchedulePeriodAvailability,
  SchedulePeriodDemand,
  TIME_OF_DAY,
  User,
  UserSchedulePeriod,
} from '@prisma/client'

export type FullScheduleDetails = SchedulePeriod & {
  schedulePeriodDemand: SchedulePeriodDemand[]
  schedulePeriodAvailability: SchedulePeriodAvailability[]
  userSchedulePeriod: UserSchedulePeriod[]
}

export type FullUserDemand = UserSchedulePeriod & {
  user: User
}

export type CreateScheduleResponse = {
  message: string
  data: CreateScheduleData
}

export type CreateScheduleData = {
  id: string
  title: string
  isPublished: boolean
  repeat: boolean
  data: PeriodDemand[]
}

export type PeriodDemand = {
  id: string
  day: DAY_OF_WEEK
  timeFrame: TIME_OF_DAY
  startTime: string
  endTime: string
  neededWorkers: number
  availableWorkers: number
  status: string
  workers: UserAvailability[]
}

export type UserAvailability = {
  userId: string
  avatar: string | null
  fullName: string
  email: string
}
