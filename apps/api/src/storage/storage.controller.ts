import { Controller, Post, Body, Get, Query } from "@nestjs/common";
import { StorageService } from "./storage.service";

@Controller("storage")
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post("upload-url")
  async getUploadUrl(@Body() body: { filename: string; contentType: string }) {
    // Generate a unique key for the file
    const ext = body.filename.split(".").pop();
    const key = `videos/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const url = await this.storageService.getUploadUrl(key, body.contentType);
    return { url, key };
  }

  @Get("view-url")
  async getViewUrl(@Query("key") key: string) {
    const url = await this.storageService.getDownloadUrl(key);
    return { url };
  }
}
