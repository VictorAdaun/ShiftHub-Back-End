import { Prisma, SwapShifts } from "@prisma/client";
import { Service } from "typedi";

import { prisma } from "../../../prismaClient";
import { SwapWithUsers } from "../types/EmployeeTypes";

@Service()
export class ShiftSwapRepository {
  async createSwap(
    swapDetails: Prisma.SwapShiftsCreateInput
  ): Promise<SwapShifts> {
    return await prisma.swapShifts.create({
      data: swapDetails,
    });
  }

  async findMany(query: Prisma.SwapShiftsFindManyArgs): Promise<SwapShifts[]> {
    return await prisma.swapShifts.findMany(query);
  }

  async findOne(
    query: Prisma.SwapShiftsFindFirstArgs
  ): Promise<SwapShifts | null> {
    return await prisma.swapShifts.findFirst(query);
  }

  async findById(id: string): Promise<SwapWithUsers | null> {
    return await prisma.swapShifts.findFirst({
      where: {
        id,
      },
      include: {
        reciever: true,
        requester: true,
        recieverShift: true,
        requesterShift: true,
      },
    });
  }

  async findUserRecievedSwaps(
    userId: string,
    take: number,
    skip: number
  ): Promise<SwapWithUsers[]> {
    return await prisma.swapShifts.findMany({
      where: {
        reciever: {
          id: userId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        reciever: true,
        requester: true,
        recieverShift: true,
        requesterShift: true,
      },
      take,
      skip,
    });
  }

  async findUserSentSwaps(
    userId: string,
    take: number,
    skip: number
  ): Promise<SwapWithUsers[]> {
    return await prisma.swapShifts.findMany({
      where: {
        requester: {
          id: userId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        reciever: true,
        requester: true,
        recieverShift: true,
        requesterShift: true,
      },
      take,
      skip,
    });
  }

  async findBothIds(
    requestId: string,
    recieveId: string
  ): Promise<SwapShifts | null> {
    return await prisma.swapShifts.findFirst({
      where: {
        AND: [{ recieverShiftId: recieveId }, { requesterShiftId: requestId }],
      },
    });
  }

  async updateOne(
    id: string,
    query: Prisma.SwapShiftsUpdateInput
  ): Promise<SwapShifts | null> {
    return await prisma.swapShifts.update({
      where: { id },
      data: query,
    });
  }
}
