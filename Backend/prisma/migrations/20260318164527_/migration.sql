/*
  Warnings:

  - The values [OWNER,STAFF] on the enum `User_role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Article` MODIFY `summary` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('SUPER_ADMIN', 'CUSTOMER') NOT NULL DEFAULT 'CUSTOMER';

-- RenameIndex
ALTER TABLE `Article` RENAME INDEX `Article_authorId_fkey` TO `Article_authorId_idx`;
