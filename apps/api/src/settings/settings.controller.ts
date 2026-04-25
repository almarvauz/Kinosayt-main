import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SettingsService } from "./settings.service";

@Controller("settings")
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly config: ConfigService,
  ) {}

  /** Verify the request has the correct super-admin token */
  private checkToken(token: string | undefined) {
    const expected = this.config.get<string>("SUPER_ADMIN_TOKEN");
    if (!expected || token !== `Bearer ${expected}`) {
      throw new ForbiddenException("Invalid or missing admin token");
    }
  }

  /** GET /settings - list all settings (keys only, values masked) */
  @Get()
  async listKeys(@Headers("authorization") auth: string) {
    this.checkToken(auth);
    const all = await this.settingsService.getAll();
    // Mask sensitive values
    const masked: Record<string, string> = {};
    for (const [k, v] of Object.entries(all)) {
      masked[k] = k.toLowerCase().includes("secret") || k.toLowerCase().includes("key")
        ? v.slice(0, 4) + "****" + v.slice(-4)
        : v;
    }
    return masked;
  }

  /** PUT /settings/:key - create or update a setting */
  @Put(":key")
  async upsert(
    @Headers("authorization") auth: string,
    @Param("key") key: string,
    @Body() body: { value: string },
  ) {
    this.checkToken(auth);
    await this.settingsService.set(key, body.value);
    return { key, updated: true };
  }

  /** PUT /settings/r2/config - update all R2 settings at once */
  @Put("r2/config")
  async setR2Config(
    @Headers("authorization") auth: string,
    @Body()
    body: {
      endpoint?: string;
      accessKeyId?: string;
      secretAccessKey?: string;
      bucketName?: string;
    },
  ) {
    this.checkToken(auth);
    await this.settingsService.setR2Config(body);
    return { updated: true, message: "R2 config saved. Storage will reload on next request." };
  }

  /** DELETE /settings/:key - remove a setting */
  @Delete(":key")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Headers("authorization") auth: string,
    @Param("key") key: string,
  ) {
    this.checkToken(auth);
    await this.settingsService.delete(key);
  }
}
