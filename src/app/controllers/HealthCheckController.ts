import { dbHealth } from '@prisma/client'
import { Get, Controller } from 'routing-controllers'
import { Service } from 'typedi'

import { prisma } from '../../prismaClient'

@Controller()
@Service()
export class HealthCheckController {
  @Get('/health')
  async healthCheck(): Promise<dbHealth[]> {
    await prisma.dbHealth.create({ data: {} })

    return await prisma.dbHealth.findMany({
      orderBy: {
        id: 'desc',
      },
      take: 1,
    })
  }
}
