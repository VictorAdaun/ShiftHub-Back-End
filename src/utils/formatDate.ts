import { DAY_OF_WEEK } from '@prisma/client'
import moment from 'moment'
import { BadRequestError } from 'routing-controllers'

export function formatDate(
  date: string,
  year: number,
  week: number,
  weekDay: DAY_OF_WEEK
) {
  const allowedEnums = ['AM', 'PM']
  const getTimeOfDay = date.split(' ')
  if (!allowedEnums.includes(getTimeOfDay[1])) {
    throw new BadRequestError('Invalid date')
  }
  const split = getTimeOfDay[0].split(':')

  const currentDate = new Date(year, 0, 4)
  const offset = (currentDate.getDay() || 7) - weeks[weekDay]
  currentDate.setDate(week * 7 - offset - 3)

  const exactHour =
    getTimeOfDay[1] == 'PM' ? parseInt(split[0]) + 12 : parseInt(split[0])

  currentDate.setHours(exactHour)
  currentDate.setMinutes(parseInt(split[1]))
  currentDate.setSeconds(parseInt(split[1]))

  return currentDate
}

export function getHourDifference(date1: Date, date2: Date) {
  const currentTime = moment(date1)
  const requestedTime = moment(date2)
  const duration = moment.duration(requestedTime.diff(currentTime))
  const hoursDifference = duration.asHours()
  return hoursDifference
}

const weeks = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
}
