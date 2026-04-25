import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { SettingsService } from "../settings/settings.service";

interface R2Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client | null = null;
  private bucketName = "kinosayt";

  constructor(
    private readonly config: ConfigService,
    private readonly settings: SettingsService,
  ) {}

  async onModuleInit() {
    await this.reload();
  }

  /**
   * Reload S3 client from DB settings (fallback: env vars).
   * Called on startup and whenever super admin updates R2 config.
   */
  async reload(): Promise<void> {
    const dbConfig = await this.settings.getR2Config();

    const endpoint      = dbConfig.endpoint      ?? this.config.get<string>("R2_ENDPOINT");
    const accessKeyId   = dbConfig.accessKeyId   ?? this.config.get<string>("R2_ACCESS_KEY_ID");
    const secretKey     = dbConfig.secretAccessKey ?? this.config.get<string>("R2_SECRET_ACCESS_KEY");
    const bucketName    = dbConfig.bucketName    ?? this.config.get<string>("R2_BUCKET_NAME") ?? "kinosayt";

    this.bucketName = bucketName;

    if (endpoint && accessKeyId && secretKey) {
      this.s3 = new S3Client({
        region: "auto",
        endpoint,
        credentials: { accessKeyId, secretAccessKey: secretKey },
      });
      this.logger.log(`Cloudflare R2 initialized (bucket: ${bucketName}, source: ${dbConfig.endpoint ? "DB" : "env"})`);
    } else {
      this.s3 = null;
      this.logger.warn("R2 credentials missing — storage disabled. Set via admin panel or .env");
    }
  }

  get isConfigured(): boolean {
    return this.s3 !== null;
  }

  async getUploadUrl(key: string, contentType: string): Promise<string> {
    this.assertConfigured();
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });
    // Upload link valid for 1 hour
    return getSignedUrl(this.s3!, command, { expiresIn: 3600 });
  }

  async getDownloadUrl(key: string): Promise<string> {
    this.assertConfigured();
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    // View link valid for 3 hours — prevents cross-site hotlinking
    return getSignedUrl(this.s3!, command, { expiresIn: 10800 });
  }

  async deleteFile(key: string): Promise<void> {
    this.assertConfigured();
    await this.s3!.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }));
  }

  private assertConfigured() {
    if (!this.s3) throw new Error("Storage is not configured. Set R2 credentials via the admin panel.");
  }
}
