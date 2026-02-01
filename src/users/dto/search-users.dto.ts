import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, IsBoolean } from "class-validator";
import { Type } from "class-transformer";

export class SearchUsersDto {
  @ApiProperty({ required: false, description: "Search by email (partial match)" })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ required: false, description: "Search by last name (partial match)" })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false, description: "Search by team ID" })
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiProperty({ required: false, description: "Exclude users with any friend request status" })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  excludeWithFriendRequest?: boolean;
}
