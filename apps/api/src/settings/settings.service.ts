import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Cache } from "@nestjs/cache-manager";
import { Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";

const SETTINGS_CACHE_KEY = "app:settings";
const SETTINGS_CACHE_TTL = 60_000; // 1 min

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getAll(): Promise<Record<string, string>> {
    const cached = await this.cache.get<Record<string, string>>(SETTINGS_CACHE_KEY);
    if (cached) return cached;

    const rows = await this.prisma.setting.findMany();
    const map: Record<string, string> = {};
    for (const row of rows) map[row.key] = row.value;

    await this.cache.set(SETTINGS_CACHE_KEY, map, SETTINGS_CACHE_TTL);
    return map;
  }

  async get(key: string): Promise<string | null> {
    const all = await this.getAll();
    return all[key] ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    // Invalidate cache so next read picks up new value
    await this.cache.del(SETTINGS_CACHE_KEY);
    this.logger.log(`Setting updated: ${key}`);
  }

  async delete(key: string): Promise<void> {
    await this.prisma.setting.deleteMany({ where: { key } });
    await this.cache.del(SETTINGS_CACHE_KEY);
  }

  /** Get all R2-related settings */
  async getR2Config(): Promise<{
    endpoint: string | null;
    accessKeyId: string | null;
    secretAccessKey: string | null;
    bucketName: string | null;
  }> {
    const all = await this.getAll();
    return {
      endpoint: all["R2_ENDPOINT"] ?? null,
      accessKeyId: all["R2_ACCESS_KEY_ID"] ?? null,
      secretAccessKey: all["R2_SECRET_ACCESS_KEY"] ?? null,
      bucketName: all["R2_BUCKET_NAME"] ?? null,
      publicDomain: all["R2_PUBLIC_DOMAIN"] ?? null,
    };
  }

  async setR2Config(config: {
    endpoint?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    bucketName?: string;
    publicDomain?: string;
  }): Promise<void> {
    const pairs: [string, string][] = [];
    if (config.endpoint) pairs.push(["R2_ENDPOINT", config.endpoint]);
    if (config.accessKeyId) pairs.push(["R2_ACCESS_KEY_ID", config.accessKeyId]);
    if (config.secretAccessKey) pairs.push(["R2_SECRET_ACCESS_KEY", config.secretAccessKey]);
    if (config.bucketName) pairs.push(["R2_BUCKET_NAME", config.bucketName]);
    if (config.publicDomain) pairs.push(["R2_PUBLIC_DOMAIN", config.publicDomain]);

    for (const [key, value] of pairs) {
      await this.prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }
    await this.cache.del(SETTINGS_CACHE_KEY);
    this.logger.log(`R2 config updated (${pairs.map(([k]) => k).join(", ")})`);
  }
}
