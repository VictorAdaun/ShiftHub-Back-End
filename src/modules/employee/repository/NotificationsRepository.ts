import { Notifications, Prisma } from "@prisma/client";
import { Service } from "typedi";

import { prisma } from "../../../prismaClient";

@Service()
export class NotificationRepository {
  async createNotification(
    notificationDetails: Prisma.NotificationsCreateInput
  ): Promise<Notifications> {
    return await prisma.notifications.create({
      data: notificationDetails,
    });
  }

  async findMany(
    query: Prisma.NotificationsFindManyArgs
  ): Promise<Notifications[]> {
    return await prisma.notifications.findMany(query);
  }

  async findOne(
    query: Prisma.NotificationsFindFirstArgs
  ): Promise<Notifications | null> {
    return await prisma.notifications.findFirst(query);
  }

  async updateOne(
    id: string,
    query: Prisma.NotificationsUpdateInput
  ): Promise<Notifications | null> {
    return await prisma.notifications.update({
      where: { id },
      data: query,
    });
  }
}
