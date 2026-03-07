import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsEnum, IsOptional, IsUUID } from "class-validator";
import { Transform } from "class-transformer";
import { GameType } from "src/common/enums/gameType";

export class SummaryQueryDto {
  @ApiProperty({
    description:
      "Opponent user IDs (the group you played against). Comma-separated or repeated param, e.g. ?opponentIds=id1&opponentIds=id2&opponentIds=id3 for 3v3.",
    example: ["uuid-1", "uuid-2", "uuid-3"],
    oneOf: [
      { type: "string", description: "Comma-separated UUIDs" },
      { type: "array", items: { type: "string" } },
    ],
  })
  @Transform(({ value }: { value: string | string[] }) =>
    typeof value === "string" ? value.split(",").map((s) => s.trim()).filter(Boolean) : value,
  )
  @IsArray()
  @IsUUID("4", { each: true })
  @ArrayMinSize(1, { message: "At least one opponent ID is required" })
  opponentIds: string[];

  @ApiPropertyOptional({
    description: "Filter by game type (e.g. 3 for 3v3). If omitted, all game types are included.",
    enum: GameType,
  })
  @IsOptional()
  @Transform(({ value }: { value: string }) => (value != null && value !== "" ? Number(value) : undefined))
  @IsEnum(GameType)
  gameType?: GameType;
}
