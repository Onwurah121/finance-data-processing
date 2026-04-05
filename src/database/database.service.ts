/* eslint-disable @typescript-eslint/no-unused-vars */
import 'dotenv/config';
import {
  Injectable,
  InternalServerErrorException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor() {
    const connectionString = process.env.DATABASE_URL!;
    if (!connectionString)
      throw new InternalServerErrorException('DATABASE_URL is not configured');

    const adapter = new PrismaPg({ connectionString });

    // Create base Prisma client with soft delete extension
    const basePrisma = new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['warn', 'error'],
      errorFormat: 'pretty',
    });

    this.prisma = basePrisma.$extends({
      query: {
        user: {
          async delete({
            args,
          }: {
            args: any;
            query: (args: any) => Promise<any>;
          }): Promise<any> {
            return await basePrisma.user.update({
              where: args.where,
              data: {
                isDeleted: true,
                isDeletedAt: new Date(),
              },
            });
          },
          async findFirst({
            args,
            query,
          }: {
            args: any;
            query: (args: any) => Promise<any>;
          }): Promise<any> {
            return await query({
              ...args,
              where: {
                ...args.where,
                isDeleted: false,
              },
            });
          },
          async findUnique({
            args,
            query,
          }: {
            args: any;
            query: (args: any) => Promise<any>;
          }): Promise<any> {
            return await query({
              ...args,
              where: {
                ...args.where,
                isDeleted: false,
              },
            });
          },
        },
        transactionEntry: {
          async create({
            args,
            query,
          }: {
            args: any;
            query: (args: any) => Promise<any>;
          }): Promise<any> {
            return await query({
              ...args,
              data: {
                ...args.data,
                amount: (args.data.amount * 100).toString(), // Convert Decimal to string
              },
            });
          },
          async findMany({
            args,
            query,
          }: {
            args: any;
            query: (args: any) => Promise<any>;
          }): Promise<any> {
            const data = await query({
              ...args,
              where: {
                ...args.where,
              },
            });

            return data.map((item: any) => ({
              ...item,
              amount:
                item.amount != null
                  ? Math.trunc(Number(item.amount) / 100)
                  : item.amount,
            }));
          },
        },
      },
    }) as PrismaClient;
  }

  get client(): PrismaClient {
    return this.prisma;
  }

  async onModuleInit(): Promise<void> {
    await this.prisma.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
