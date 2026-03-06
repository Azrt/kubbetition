import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { PostType } from '../enums/post-type.enum';

export class UpdatePostDto {
  @ApiPropertyOptional({ description: 'Post body content' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ enum: PostType, description: 'Post type' })
  @IsOptional()
  @IsEnum(PostType)
  type?: PostType;

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

  @ApiPropertyOptional({ description: 'Optional due date (ISO 8601). Set to null to clear.' })
  @IsOptional()
  dueDate?: string | null;
}
