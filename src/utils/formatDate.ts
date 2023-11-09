import { DAY_OF_WEEK } from "@prisma/client";
import moment from "moment";
import { BadRequestError } from "routing-controllers";

export function formatDate(
  date: string,
  year: number,
  week: number,
  weekDay: DAY_OF_WEEK
) {
  const allowedEnums = ["AM", "PM"];
  const getTimeOfDay = date.split(" ");
  if (!allowedEnums.includes(getTimeOfDay[1])) {
    throw new BadRequestError("Invalid date");
  }
  const split = getTimeOfDay[0].split(":");

  const currentDate = new Date(year, 0, 4);
  const offset = (currentDate.getDay() || 7) - weeks[weekDay];
  currentDate.setDate(week * 7 - offset - 3);

  const exactHour =
    getTimeOfDay[1] == "PM" ? parseInt(split[0]) + 12 : parseInt(split[0]);

  currentDate.setHours(exactHour);
  currentDate.setMinutes(parseInt(split[1]));
  currentDate.setSeconds(parseInt(split[1]));

  return currentDate;
}

export function getHourDifference(date1: Date, date2: Date) {
  const currentTime = moment(date1);
  const requestedTime = moment(date2);
  const duration = moment.duration(requestedTime.diff(currentTime));
  const hoursDifference = duration.asHours();
  return hoursDifference;
}

export function getHourStringDifference(date1: string, date2: string) {
  const [hours1, minutes1, seconds1] = date1
    .split(":")
    .map((time) => parseInt(time, 10));
  const [hours2, minutes2, seconds2] = date2
    .split(":")
    .map((time) => parseInt(time, 10));

  const totalSeconds1 = (hours1 % 12) * 3600 + minutes1 * 60 + seconds1;
  const totalSeconds2 = (hours2 % 12) * 3600 + minutes2 * 60 + seconds2;

  const timeDifferenceSeconds = Math.abs(totalSeconds2 - totalSeconds1);
  const hours = Math.floor(timeDifferenceSeconds / 3600);
  return hours;
}

export function getDayDifference(date1: Date, date2: Date) {
  const currentTime = moment(date1);
  const requestedTime = moment(date2);
  const duration = moment.duration(requestedTime.diff(currentTime));

  const daysDifference = Math.floor(duration.asDays());
  duration.subtract(daysDifference, "days");
  const hoursDifference = duration.hours();

  return {
    days: daysDifference,
    hour: hoursDifference,
  };
}

export function calculateIfValid(
  date: string,
  year: number,
  week: number,
  weekDay: DAY_OF_WEEK
) {
  let currentWeek = week;
  let currentYear = year;

  if (moment().year() > currentYear) {
    throw new BadRequestError("Cannot book a schedule for past date");
  }

  if (moment().week() > currentWeek) {
    throw new BadRequestError("Cannot book a schedule for past date");
  }

  const newDate = formatDate(date, year, week, weekDay);

  if (new Date() > newDate) {
    throw new BadRequestError("Cannot book a schedule for past date");
  }
}

const weeks = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};
