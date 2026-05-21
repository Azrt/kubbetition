import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceTournamentModeWithEventMode1747756800000
  implements MigrationInterface
{
  name = 'ReplaceTournamentModeWithEventMode1747756800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."event_mode_enum" AS ENUM('tournament', 'free_for_all', 'limited_rounds')`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD "mode" "public"."event_mode_enum" NOT NULL DEFAULT 'limited_rounds'`,
    );
    await queryRunner.query(
      `UPDATE "event" SET "mode" = 'tournament' WHERE "tournamentMode" = true`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD "participantLimit" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" ADD "endTime" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "event" DROP COLUMN "tournamentMode"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "event" ADD "tournamentMode" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `UPDATE "event" SET "tournamentMode" = true WHERE "mode" = 'tournament'`,
    );
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "endTime"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "participantLimit"`);
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "mode"`);
    await queryRunner.query(`DROP TYPE "public"."event_mode_enum"`);
  }
}
