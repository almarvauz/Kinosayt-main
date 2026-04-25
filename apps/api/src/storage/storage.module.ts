import { Module } from "@nestjs/common";
import { StorageService } from "./storage.service";
import { StorageController } from "./storage.controller";
import { SettingsModule } from "../settings/settings.module";

@Module({
  imports: [SettingsModule],
  providers: [StorageService],
  controllers: [StorageController],
  exports: [StorageService],
})
export class StorageModule {}
