import { Injectable } from '@nestjs/common';
import { Prisma, OperationLog } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

type RecordLogInput = {
  action: string;
  success: boolean;
  accountId?: number;
  targetUrl?: string;
  message?: string;
  detail?: Prisma.InputJsonValue;
};

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  record(input: RecordLogInput): Promise<OperationLog> {
    return this.prisma.operationLog.create({
      data: input,
    });
  }

  findAll(limit = 100) {
    return this.prisma.operationLog.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
