import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString } from "class-validator";

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
  @Type(() => Number)
  @IsInt()
  teamId?: number;
}
