import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';
import * as crypto from 'crypto';

export enum FileType {
  USER_AVATAR = 'avatars',
  EVENT_IMAGE = 'events',
  TEAM_LOGO = 'teams',
  GAME_PHOTO = 'games',
}

@Injectable()
export class FileUploadService {
  private useS3: boolean;
  private s3Config: {
    region: string;
    buckets: {
      avatars: string;
      events: string;
      teams: string;
      games: string;
    };
  } | null = null;

  constructor(private configService: ConfigService) {
    // Check if S3 is configured
    const awsRegion = this.configService.get<string>('AWS_REGION');
    const awsAccessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const awsSecretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const avatarBucket = this.configService.get<string>('AWS_S3_AVATAR_BUCKET');
    const eventBucket = this.configService.get<string>('AWS_S3_EVENT_BUCKET');
    const teamBucket = this.configService.get<string>('AWS_S3_TEAM_BUCKET');
    const gameBucket = this.configService.get<string>('AWS_S3_GAME_BUCKET');

    this.useS3 =
      !!awsRegion &&
      !!awsAccessKeyId &&
      !!awsSecretAccessKey &&
      !!avatarBucket &&
      !!eventBucket &&
      !!teamBucket &&
      !!gameBucket;

    if (this.useS3) {
      this.s3Config = {
        region: awsRegion!,
        buckets: {
          avatars: avatarBucket!,
          events: eventBucket!,
          teams: teamBucket!,
          games: gameBucket!,
        },
      };
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    fileType: FileType,
    options?: {
      resize?: { width: number; height?: number };
      format?: 'png' | 'jpeg' | 'webp';
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
        sharpInstance = sharpInstance.resize(options.resize.width, options.resize.height, {
          fit: 'inside',
          withoutEnlargement: true,
        });
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

    // Generate unique filename
    const fileExtension = processedFormat === 'jpeg' ? 'jpg' : processedFormat;
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const filename = `${uniqueId}.${fileExtension}`;

    if (this.useS3 && this.s3Config) {
      return this.uploadToS3(processedBuffer, filename, fileType, processedFormat);
    } else {
      return this.uploadLocally(processedBuffer, filename, fileType, processedFormat);
    }
  }

  private async uploadToS3(
    buffer: Buffer,
    filename: string,
    fileType: FileType,
    format: string,
  ): Promise<string> {
    if (!this.s3Config) {
      throw new Error('S3 not configured');
    }

    const bucketName = this.s3Config.buckets[fileType];
    const key = `${fileType}/${filename}`;
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

      await s3
        .upload({
          Bucket: bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          ACL: 'public-read',
        })
        .promise();

      // Return S3 URL
      return `https://${bucketName}.s3.${this.s3Config.region}.amazonaws.com/${key}`;
    } catch (error) {
      throw new BadRequestException('Failed to upload file to S3');
    }
  }

  private async uploadLocally(
    buffer: Buffer,
    filename: string,
    fileType: FileType,
    format: string,
  ): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'uploads', fileType);

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);

    try {
      // Use writeFileSync with Buffer - Buffer is compatible with Node.js fs operations
      fs.writeFileSync(filePath, buffer as NodeJS.ArrayBufferView);

      // Return relative path for local storage
      return `uploads/${fileType}/${filename}`;
    } catch (error) {
      throw new BadRequestException('Failed to save file locally');
    }
  }

  async deleteFile(fileUrl: string, fileType: FileType): Promise<void> {
    if (this.useS3 && this.s3Config) {
      await this.deleteFromS3(fileUrl, fileType);
    } else {
      await this.deleteLocally(fileUrl);
    }
  }

  private async deleteFromS3(fileUrl: string, fileType: FileType): Promise<void> {
    if (!this.s3Config) {
      return;
    }

    try {
      // Extract key from S3 URL
      const urlParts = fileUrl.split('/');
      const key = urlParts.slice(-2).join('/'); // Get last two parts (fileType/filename)

      const bucketName = this.s3Config.buckets[fileType];
      const AWS = require('aws-sdk');
      const s3 = new AWS.S3({
        region: this.s3Config.region,
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      });

      await s3
        .deleteObject({
          Bucket: bucketName,
          Key: key,
        })
        .promise();
    } catch (error) {
      // Log error but don't throw - file might not exist
      console.error('Failed to delete file from S3:', error);
    }
  }

  private async deleteLocally(fileUrl: string): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      // Log error but don't throw - file might not exist
      console.error('Failed to delete local file:', error);
    }
  }
}
