import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { PostType } from '../enums/post-type.enum';

export class CreatePostDto {
  @ApiProperty({ description: 'Post body content' })
  @IsString()
  @MaxLength(10000)
  body: string;

  @ApiPropertyOptional({
    enum: PostType,
    default: PostType.INFO,
    description: 'Post type',
  })
  @IsOptional()
  @IsEnum(PostType)
  type?: PostType = PostType.INFO;

  @ApiPropertyOptional({ description: 'Optional link URL' })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(2048)
  link?: string;

  @ApiPropertyOptional({ description: 'Whether the post is pinned (admin/superadmin/supervisor only)' })
  @IsOptional()
  @IsBoolean()
  pinned?: boolean;

  @ApiPropertyOptional({ description: 'Optional due date - post hidden after this date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
