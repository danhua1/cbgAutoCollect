CREATE TABLE `Account` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `usernameEncrypted` TEXT NOT NULL,
  `passwordEncrypted` TEXT NOT NULL,
  `remark` VARCHAR(255) NULL,
  `isDefault` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `Account_name_key`(`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `OperationLog` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `action` VARCHAR(60) NOT NULL,
  `success` BOOLEAN NOT NULL,
  `accountId` INTEGER NULL,
  `targetUrl` TEXT NULL,
  `message` TEXT NULL,
  `detail` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `OperationLog_accountId_createdAt_idx`(`accountId`, `createdAt`),
  INDEX `OperationLog_action_createdAt_idx`(`action`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `OperationLog`
  ADD CONSTRAINT `OperationLog_accountId_fkey`
  FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

