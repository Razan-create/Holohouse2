-- AlterTable
ALTER TABLE `FileUpload` ADD COLUMN `analysisData` JSON NULL,
    ADD COLUMN `excelPath` VARCHAR(191) NULL,
    ADD COLUMN `pdfPath` VARCHAR(191) NULL;
