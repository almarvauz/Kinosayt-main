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

  /** GET /settings/public — no auth, returns public site config (SITE_NAME, TELEGRAM_CHANNEL) */
  @Get("public")
  async getPublic() {
    const all = await this.settingsService.getAll();
    return {
      SITE_NAME: all["SITE_NAME"] ?? "PlayKinoUz",
      TELEGRAM_CHANNEL: all["TELEGRAM_CHANNEL"] ?? "https://t.me/playkinouz",
      SITE_DESCRIPTION: all["SITE_DESCRIPTION"] ?? "O'zbek tilida eng yaxshi kinolar",
    };
  }

  /** GET /settings - list all settings (masked) */
  @Get()
  async listKeys(@Headers("authorization") auth: string) {
    this.checkToken(auth);
    const all = await this.settingsService.getAll();
    const masked: Record<string, string> = {};
    for (const [k, v] of Object.entries(all)) {
      masked[k] =
        k.toLowerCase().includes("secret") || k.toLowerCase().includes("key")
          ? v.slice(0, 4) + "****" + v.slice(-4)
          : v;
    }
    return masked;
  }

  /** PUT /settings/site/config - update site name, telegram channel, description */
  @Put("site/config")
  async setSiteConfig(
    @Headers("authorization") auth: string,
    @Body()
    body: {
      siteName?: string;
      telegramChannel?: string;
      siteDescription?: string;
    },
  ) {
    this.checkToken(auth);
    if (body.siteName) await this.settingsService.set("SITE_NAME", body.siteName);
    if (body.telegramChannel)
      await this.settingsService.set("TELEGRAM_CHANNEL", body.telegramChannel);
    if (body.siteDescription)
      await this.settingsService.set("SITE_DESCRIPTION", body.siteDescription);
    return { updated: true };
  }

  /** PUT /settings/r2/config - update all R2 credentials at once */
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

  /** PUT /settings/:key - create or update a single setting */
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

  /** DELETE /settings/:key */
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
