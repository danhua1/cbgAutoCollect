import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CryptoService } from '../common/crypto.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
    private readonly logsService: LogsService,
  ) {}

  private async toggleDefaultAccount(nextDefaultId?: number) {
    if (!nextDefaultId) {
      return;
    }

    await this.prisma.account.updateMany({
      where: {
        NOT: {
          id: nextDefaultId,
        },
      },
      data: {
        isDefault: false,
      },
    });
  }

  private presentAccount(account: {
    id: number;
    name: string;
    usernameEncrypted: string;
    remark: string | null;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: account.id,
      name: account.name,
      usernameEncrypted: account.usernameEncrypted,
      usernamePreview: this.cryptoService.decrypt(account.usernameEncrypted),
      remark: account.remark,
      isDefault: account.isDefault,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  async findAll() {
    const accounts = await this.prisma.account.findMany({
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return accounts.map((item) => this.presentAccount(item));
  }

  async findOne(id: number) {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException(`Account ${id} not found`);
    }

    return this.presentAccount(account);
  }

  async findByIds(ids?: number[]) {
    const where = ids?.length
      ? {
          id: {
            in: ids,
          },
        }
      : undefined;

    return this.prisma.account.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async create(dto: CreateAccountDto) {
    if (dto.isDefault) {
      await this.toggleDefaultAccount(-1);
    }

    const created = await this.prisma.account.create({
      data: {
        name: dto.name,
        usernameEncrypted: this.cryptoService.ensureEncrypted(dto.username),
        passwordEncrypted: this.cryptoService.ensureEncrypted(dto.password),
        remark: dto.remark,
        isDefault: Boolean(dto.isDefault),
      },
    });

    if (created.isDefault) {
      await this.toggleDefaultAccount(created.id);
    }

    await this.logsService.record({
      action: 'account_create',
      success: true,
      accountId: created.id,
      message: `Created account ${created.name}`,
    });

    return this.presentAccount(created);
  }

  async update(id: number, dto: UpdateAccountDto) {
    await this.findOne(id);

    const updated = await this.prisma.account.update({
      where: { id },
      data: {
        name: dto.name,
        usernameEncrypted:
          dto.username === undefined
            ? undefined
            : this.cryptoService.ensureEncrypted(dto.username),
        passwordEncrypted:
          dto.password === undefined
            ? undefined
            : this.cryptoService.ensureEncrypted(dto.password),
        remark: dto.remark,
        isDefault: dto.isDefault,
      },
    });

    if (updated.isDefault) {
      await this.toggleDefaultAccount(updated.id);
    }

    await this.logsService.record({
      action: 'account_update',
      success: true,
      accountId: updated.id,
      message: `Updated account ${updated.name}`,
    });

    return this.presentAccount(updated);
  }

  async remove(id: number) {
    const current = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!current) {
      throw new NotFoundException(`Account ${id} not found`);
    }

    await this.prisma.account.delete({
      where: { id },
    });

    await this.logsService.record({
      action: 'account_delete',
      success: true,
      accountId: id,
      message: `Deleted account ${current.name}`,
    });

    return { success: true };
  }

  decryptCredentials(account: { usernameEncrypted: string; passwordEncrypted: string }) {
    return {
      username: this.cryptoService.decrypt(account.usernameEncrypted),
      password: this.cryptoService.decrypt(account.passwordEncrypted),
    };
  }
}
