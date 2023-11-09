import { Prisma, SwapShifts } from "@prisma/client";
import { Service } from "typedi";

import { prisma } from "../../../prismaClient";

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
