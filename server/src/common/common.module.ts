import { Module } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService, CryptoService],
  exports: [PrismaService, CryptoService],
})
export class CommonModule {}
