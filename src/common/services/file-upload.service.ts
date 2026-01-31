import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';
import * as crypto from 'crypto';

export enum FileType {
  USER_AVATAR = 'user',
  EVENT_IMAGE = 'event',
  TEAM_LOGO = 'team',
  GAME_PHOTO = 'game',
}

@Injectable()
export class FileUploadService {
  private useS3: boolean;
  private s3Config: {
    region: string;
    publicBucket: string;
    privateBucket: string;
  } | null = null;
  private cloudflareConfig: {
    publicCdnUrl: string;
    privateCdnUrl: string;
  } | null = null;

  // File types that go to public bucket
  private readonly PUBLIC_FILE_TYPES = [FileType.USER_AVATAR, FileType.TEAM_LOGO];
  // File types that go to private bucket
  private readonly PRIVATE_FILE_TYPES = [FileType.EVENT_IMAGE, FileType.GAME_PHOTO];
  
  // Long TTL for game photos (1 year in seconds) since they don't change
  private readonly GAME_PHOTO_TTL = 31536000; // 365 * 24 * 60 * 60

  constructor(private configService: ConfigService) {
    // Check if S3 is configured
    const awsRegion = this.configService.get<string>('AWS_REGION');
    const awsAccessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const awsSecretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const publicBucket = this.configService.get<string>('AWS_S3_PUBLIC_BUCKET');
    const privateBucket = this.configService.get<string>('AWS_S3_PRIVATE_BUCKET');

    this.useS3 =
      !!awsRegion &&
      !!awsAccessKeyId &&
      !!awsSecretAccessKey &&
      !!publicBucket &&
      !!privateBucket;

    if (this.useS3) {
      this.s3Config = {
        region: awsRegion!,
        publicBucket: publicBucket!,
        privateBucket: privateBucket!,
      };
    }

    // Check if Cloudflare CDN is configured
    const publicCdnUrl = this.configService.get<string>('CLOUDFLARE_PUBLIC_CDN_URL');
    const privateCdnUrl = this.configService.get<string>('CLOUDFLARE_PRIVATE_CDN_URL');

    if (publicCdnUrl && privateCdnUrl) {
      this.cloudflareConfig = {
        publicCdnUrl: publicCdnUrl.endsWith('/') ? publicCdnUrl.slice(0, -1) : publicCdnUrl,
        privateCdnUrl: privateCdnUrl.endsWith('/') ? privateCdnUrl.slice(0, -1) : privateCdnUrl,
      };
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    fileType: FileType,
    entityId: number,
    options?: {
      resize?: { width: number; height?: number };
      format?: 'png' | 'jpeg' | 'webp';
      filename?: string; // Optional custom filename (defaults to entity-specific name)
    },
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
    }

    // Process image with sharp
    let processedBuffer = file.buffer;
    let processedFormat: 'png' | 'jpeg' | 'webp' = options?.format || 'jpeg';

    try {
      let sharpInstance = sharp(file.buffer);

      // Resize if specified
      if (options?.resize) {
        const resizeOptions: sharp.ResizeOptions = {
          width: options.resize.width,
          height: options.resize.height,
          fit: 'inside',
          withoutEnlargement: true,
        };
        sharpInstance = sharpInstance.resize(resizeOptions);
      }

      // Convert format
      if (processedFormat === 'png') {
        processedBuffer = await sharpInstance.png().toBuffer();
      } else if (processedFormat === 'webp') {
        processedBuffer = await sharpInstance.webp().toBuffer();
      } else {
        processedBuffer = await sharpInstance.jpeg({ quality: 90 }).toBuffer();
        processedFormat = 'jpeg';
      }
    } catch (error) {
      throw new BadRequestException('Failed to process image');
    }

    // Generate hash of the processed image content for cache invalidation
    // Hash is based on file content, so when file changes, hash changes, enabling cache revalidation
    const fileHash = crypto.createHash('sha256').update(processedBuffer as any).digest('hex').substring(0, 16);
    
    // Generate filename based on file type
    const fileExtension = processedFormat === 'jpeg' ? 'jpg' : processedFormat;
    let filename: string;
    
    if (options?.filename) {
      // If custom filename provided, add hash before extension
      const nameWithoutExt = options.filename.replace(/\.[^/.]+$/, '');
      filename = `${nameWithoutExt}.${fileHash}.${fileExtension}`;
    } else {
      // Default filenames based on file type, with hash included
      let baseName: string;
      switch (fileType) {
        case FileType.USER_AVATAR:
          baseName = 'avatar';
          break;
        case FileType.TEAM_LOGO:
          baseName = 'logo';
          break;
        case FileType.GAME_PHOTO:
          baseName = 'social-photo';
          break;
        case FileType.EVENT_IMAGE:
          baseName = 'image';
          break;
        default:
          baseName = crypto.randomBytes(8).toString('hex');
      }
      filename = `${baseName}.${fileHash}.${fileExtension}`;
    }

    // Determine if file should be private (based on file type)
    const isPrivate = this.PRIVATE_FILE_TYPES.includes(fileType);

    if (this.useS3 && this.s3Config) {
      return this.uploadToS3(processedBuffer, filename, fileType, entityId, processedFormat, isPrivate);
    } else {
      return this.uploadLocally(processedBuffer, filename, fileType, entityId, processedFormat);
    }
  }

  private async uploadToS3(
    buffer: Buffer,
    filename: string,
    fileType: FileType,
    entityId: number,
    format: string,
    isPrivate: boolean,
  ): Promise<string> {
    if (!this.s3Config) {
      throw new Error('S3 not configured');
    }

    // Determine bucket based on file type
    const bucketName = isPrivate ? this.s3Config.privateBucket : this.s3Config.publicBucket;
    
    // Build key with prefix: /{fileType}/{entityId}/{filename}
    const key = `${fileType}/${entityId}/${filename}`;
    const contentType = `image/${format === 'jpeg' ? 'jpeg' : format}`;

    try {
      // Use AWS SDK v2 style (if aws-sdk is installed) or implement with fetch
      // For now, we'll use a simple approach with the AWS SDK
      const AWS = require('aws-sdk');
      const s3 = new AWS.S3({
        region: this.s3Config.region,
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      });

      const uploadParams: any = {
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      };

      // Only set ACL if not private (private objects don't need ACL)
      if (!isPrivate) {
        uploadParams.ACL = 'public-read';
      }

      await s3.upload(uploadParams).promise();

      // Return path string that can be easily used by frontend
      // Format: s3://{bucket}/{key} or just {key} for easier parsing
      // We'll use the key format: {fileType}/{entityId}/{filename}
      return key;
    } catch (error) {
      throw new BadRequestException('Failed to upload file to S3');
    }
  }

  private async uploadLocally(
    buffer: Buffer,
    filename: string,
    fileType: FileType,
    entityId: number,
    format: string,
  ): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'uploads', fileType, entityId.toString());

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);

    try {
      // Use writeFileSync with Buffer - Buffer is compatible with Node.js fs operations
      fs.writeFileSync(filePath, buffer as NodeJS.ArrayBufferView);

      // Return relative path for local storage (matching S3 key format)
      return `${fileType}/${entityId}/${filename}`;
    } catch (error) {
      throw new BadRequestException('Failed to save file locally');
    }
  }

  /**
   * Extract file path from a stored value (handles both old URL format and new path format)
   * @param storedValue The value stored in database (could be URL or path)
   * @param fileType The type of file
   * @returns The file path in format: {fileType}/{entityId}/{filename}
   */
  private extractFilePath(storedValue: string, fileType: FileType): string | null {
    if (!storedValue) return null;

    // If it's already in the new format (starts with fileType/)
    if (storedValue.startsWith(`${fileType}/`)) {
      return storedValue;
    }

    // If it's a full URL, extract the path
    if (storedValue.startsWith('http://') || storedValue.startsWith('https://')) {
      // Extract key from URL: https://bucket.s3.region.amazonaws.com/user/123/avatar.jpg
      const urlParts = storedValue.split('/');
      // Find the part after the domain and join
      const domainIndex = urlParts.findIndex(part => part.includes('.s3.'));
      if (domainIndex >= 0 && domainIndex < urlParts.length - 1) {
        return urlParts.slice(domainIndex + 1).join('/');
      }
    }

    // If it's an old format path like "uploads/user/filename", extract the relevant parts
    if (storedValue.includes('/')) {
      const parts = storedValue.split('/');
      // Try to find fileType in the path
      const fileTypeIndex = parts.findIndex(p => p === fileType);
      if (fileTypeIndex >= 0 && fileTypeIndex < parts.length - 1) {
        return parts.slice(fileTypeIndex).join('/');
      }
    }

    // If we can't parse it, return as-is (might be just a filename)
    return storedValue;
  }

  async deleteFile(storedValue: string, fileType: FileType): Promise<void> {
    const filePath = this.extractFilePath(storedValue, fileType);
    if (!filePath) return;

    if (this.useS3 && this.s3Config) {
      await this.deleteFromS3(filePath, fileType);
    } else {
      await this.deleteLocally(filePath);
    }
  }

  private async deleteFromS3(filePath: string, fileType: FileType): Promise<void> {
    if (!this.s3Config) {
      return;
    }

    try {
      // filePath is in format: {fileType}/{entityId}/{filename}
      // Determine bucket based on file type
      const isPrivate = this.PRIVATE_FILE_TYPES.includes(fileType);
      const bucketName = isPrivate ? this.s3Config.privateBucket : this.s3Config.publicBucket;

      const AWS = require('aws-sdk');
      const s3 = new AWS.S3({
        region: this.s3Config.region,
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      });

      await s3
        .deleteObject({
          Bucket: bucketName,
          Key: filePath,
        })
        .promise();
    } catch (error) {
      // Log error but don't throw - file might not exist
      console.error('Failed to delete file from S3:', error);
    }
  }

  private async deleteLocally(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(process.cwd(), 'uploads', filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error) {
      // Log error but don't throw - file might not exist
      console.error('Failed to delete local file:', error);
    }
  }

  /**
   * Generate a presigned URL for a private S3 object
   * @param storedValue The value stored in database (could be URL or path)
   * @param fileType The type of file
   * @param expiresIn Expiration time in seconds (default: 1 hour, or long TTL for game photos)
   * @param useCloudflare Whether to use Cloudflare CDN if available (default: true for game photos)
   * @returns Presigned URL that allows temporary access to the private object
   */
  async getPresignedUrl(
    storedValue: string, 
    fileType: FileType, 
    expiresIn?: number,
    useCloudflare?: boolean
  ): Promise<string> {
    const filePath = this.extractFilePath(storedValue, fileType);
    if (!filePath) {
      throw new BadRequestException('Invalid file path');
    }

    if (!this.useS3 || !this.s3Config) {
      // For local files, return a local URL
      return `/uploads/${filePath}`;
    }

    // Use long TTL for game photos if not specified
    const ttl = expiresIn ?? (fileType === FileType.GAME_PHOTO ? this.GAME_PHOTO_TTL : 3600);
    
    // Use Cloudflare CDN if configured and requested (default true for game photos)
    const shouldUseCloudflare = useCloudflare ?? (fileType === FileType.GAME_PHOTO && this.cloudflareConfig !== null);

    try {
      // filePath is in format: {fileType}/{entityId}/{filename}
      // Determine bucket based on file type
      const isPrivate = this.PRIVATE_FILE_TYPES.includes(fileType);
      const bucketName = isPrivate ? this.s3Config.privateBucket : this.s3Config.publicBucket;

      const AWS = require('aws-sdk');
      const s3 = new AWS.S3({
        region: this.s3Config.region,
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      });

      // Generate presigned URL from S3
      const presignedUrl = s3.getSignedUrl('getObject', {
        Bucket: bucketName,
        Key: filePath,
        Expires: ttl,
      });

      // If Cloudflare is configured and should be used, convert S3 URL to Cloudflare CDN URL
      if (shouldUseCloudflare && this.cloudflareConfig) {
        return this.convertToCloudflareUrl(presignedUrl, fileType);
      }

      return presignedUrl;
    } catch (error) {
      throw new BadRequestException('Failed to generate presigned URL');
    }
  }

  /**
   * Convert S3 presigned URL to Cloudflare CDN URL
   * Preserves all query parameters (including AWS signature) for authentication
   * 
   * Note: Cloudflare must be configured to proxy requests to S3. The CDN URL should
   * point to the same S3 bucket, and Cloudflare will cache responses based on Cache-Control headers.
   * 
   * @param s3Url The S3 presigned URL
   * @param fileType The type of file
   * @returns Cloudflare CDN URL with the same query parameters
   */
  private convertToCloudflareUrl(s3Url: string, fileType: FileType): string {
    if (!this.cloudflareConfig) {
      return s3Url;
    }

    try {
      const url = new URL(s3Url);
      const isPrivate = this.PRIVATE_FILE_TYPES.includes(fileType);
      const cdnBaseUrl = isPrivate ? this.cloudflareConfig.privateCdnUrl : this.cloudflareConfig.publicCdnUrl;
      
      // Extract the path and all query parameters from S3 URL
      // S3 URL format: https://bucket.s3.region.amazonaws.com/path?X-Amz-Algorithm=...&X-Amz-Credential=...&X-Amz-Signature=...
      // Cloudflare CDN URL: https://cdn.example.com/path?X-Amz-Algorithm=...&X-Amz-Credential=...&X-Amz-Signature=...
      // The query parameters (including AWS signature) are preserved so Cloudflare can proxy to S3
      // Cloudflare will cache the response with long TTL since game photos don't change
      const pathWithQuery = url.pathname + (url.search || '');
      
      return `${cdnBaseUrl}${pathWithQuery}`;
    } catch (error) {
      // If URL parsing fails, return original S3 URL
      console.error('Failed to convert to Cloudflare URL:', error);
      return s3Url;
    }
  }

  /**
   * Get public URL for a file in the public bucket
   * @param storedValue The value stored in database (could be URL or path)
   * @param fileType The type of file
   * @param useCloudflare Whether to use Cloudflare CDN if available (default: true)
   * @returns Public URL for the file
   */
  getPublicUrl(storedValue: string, fileType: FileType, useCloudflare: boolean = true): string {
    // Only public file types should use this method
    if (this.PRIVATE_FILE_TYPES.includes(fileType)) {
      throw new BadRequestException('Cannot get public URL for private file type');
    }

    const filePath = this.extractFilePath(storedValue, fileType);
    if (!filePath) {
      return storedValue; // Return as-is if we can't parse
    }

    if (!this.useS3 || !this.s3Config) {
      // For local files, return a local URL
      return `/uploads/${filePath}`;
    }

    // Use Cloudflare CDN if configured
    if (useCloudflare && this.cloudflareConfig) {
      return `${this.cloudflareConfig.publicCdnUrl}/${filePath}`;
    }

    // Fallback to S3 URL
    const bucketName = this.s3Config.publicBucket;
    return `https://${bucketName}.s3.${this.s3Config.region}.amazonaws.com/${filePath}`;
  }

  /**
   * Transform file path to URL based on file type
   * For public files, returns public URL
   * For private files, returns the path (frontend should request presigned URL)
   * @param storedValue The value stored in database
   * @param fileType The type of file
   * @returns URL for public files, path for private files
   */
  getFileUrl(storedValue: string | null, fileType: FileType): string | null {
    if (!storedValue) return null;

    // For public files, return public URL
    if (this.PUBLIC_FILE_TYPES.includes(fileType)) {
      return this.getPublicUrl(storedValue, fileType);
    }

    // For private files, return the path as-is (frontend will request presigned URL)
    return storedValue;
  }
}
