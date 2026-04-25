import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client;
  private readonly bucketName: string;

  constructor(private config: ConfigService) {
    this.bucketName = this.config.get<string>("R2_BUCKET_NAME") || "kinosayt";
    
    // Ensure we only initialize S3 if credentials are provided
    const endpoint = this.config.get<string>("R2_ENDPOINT");
    const accessKeyId = this.config.get<string>("R2_ACCESS_KEY_ID");
    const secretAccessKey = this.config.get<string>("R2_SECRET_ACCESS_KEY");

    if (endpoint && accessKeyId && secretAccessKey) {
      this.s3 = new S3Client({
        region: "auto",
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log("Cloudflare R2 Storage initialized.");
    } else {
      this.logger.warn("Cloudflare R2 credentials are missing. Storage service disabled.");
    }
  }

  async getUploadUrl(key: string, contentType: string): Promise<string> {
    if (!this.s3) throw new Error("Storage service is not configured.");
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });
    // Upload URL is valid for 1 hour
    return getSignedUrl(this.s3, command, { expiresIn: 3600 });
  }

  async getDownloadUrl(key: string): Promise<string> {
    if (!this.s3) throw new Error("Storage service is not configured.");

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    // Download URL is valid for 3 hours to prevent hotlinking
    return getSignedUrl(this.s3, command, { expiresIn: 10800 });
  }
}
