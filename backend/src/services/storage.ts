import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

export interface UploadResult {
  url: string;
  key: string;
}

class StorageService {
  private s3Client: S3Client | null = null;
  private bucketName: string = '';
  private publicUrl: string = '';
  private accountId: string = '';

  constructor() {
    this.initCloudflare();
  }

  private initCloudflare() {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim();
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim();
    const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim() || '';

    if (accountId && accessKeyId && secretAccessKey && bucketName) {
      try {
        this.s3Client = new S3Client({
          region: 'auto',
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        this.bucketName = bucketName;
        this.publicUrl = publicUrl.replace(/\/$/, '');
        this.accountId = accountId;
        console.log(`Cloudflare R2 Bucket storage initialized: ${bucketName}`);
      } catch (err) {
        console.error('Failed to initialize Cloudflare R2 client:', err);
        this.s3Client = null;
      }
    } else {
      console.warn('Cloudflare R2 credentials not fully populated. Image upload will not work.');
    }
  }

  get isReady(): boolean {
    return this.s3Client !== null && this.bucketName !== '';
  }

  /**
   * Upload an image for a specific shop/user.
   * Path in Cloudflare R2:
   * paint-shop/{userUuid}/{filename}
   */
  async uploadShopImage(params: {
    userUuid: string;
    filename: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<UploadResult> {
    const { userUuid, filename, buffer, mimeType } = params;
    const r2Key = `paint-shop/${userUuid}/${filename}`;

    if (!this.s3Client || !this.bucketName) {
      throw new Error('Cloudflare R2 storage is not configured. Cannot upload image.');
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: r2Key,
      Body: buffer,
      ContentType: mimeType,
    });

    await this.s3Client.send(command);

    // Determine accessible URL
    let fileUrl: string;
    if (this.publicUrl) {
      // Use the configured public domain (r2.dev or custom domain)
      fileUrl = `${this.publicUrl}/${r2Key}`;
    } else {
      // No public URL configured — serve via backend proxy endpoint
      fileUrl = `/api/storage/${userUuid}/${filename}`;
    }

    console.log(`Successfully uploaded image to Cloudflare R2 at ${r2Key}`);
    return {
      url: fileUrl,
      key: r2Key,
    };
  }

  /**
   * Generate a presigned GET URL for an object in R2.
   * Used by the proxy endpoint when no public URL is configured.
   */
  async getSignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string | null> {
    if (!this.s3Client || !this.bucketName) return null;

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }

  /**
   * Stream an object from R2 directly.
   * Returns the response body stream and content type.
   */
  async getObject(key: string): Promise<{ body: any; contentType: string } | null> {
    if (!this.s3Client || !this.bucketName) return null;

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      return {
        body: response.Body,
        contentType: response.ContentType || 'application/octet-stream',
      };
    } catch (err) {
      console.error(`Failed to get object from R2 (${key}):`, err);
      return null;
    }
  }
}

export const storageService = new StorageService();
