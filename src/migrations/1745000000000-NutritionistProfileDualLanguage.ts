import { MigrationInterface, QueryRunner } from 'typeorm';

export class NutritionistProfileDualLanguage1745000000000
  implements MigrationInterface
{
  name = 'NutritionistProfileDualLanguage1745000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // bio
    await queryRunner.query(
      `ALTER TABLE "nutritionist_profile" ADD "bio_el" text`,
    );
    await queryRunner.query(
      `UPDATE "nutritionist_profile" SET "bio_el" = "bio"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nutritionist_profile" ADD "bio_en" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "nutritionist_profile" DROP COLUMN "bio"`,
    );

    // city
    await queryRunner.query(
      `ALTER TABLE "nutritionist_profile" ADD "city_el" character varying`,
    );
    await queryRunner.query(
      `UPDATE "nutritionist_profile" SET "city_el" = "city"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nutritionist_profile" ADD "city_en" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "nutritionist_profile" DROP COLUMN "city"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // city
    await queryRunner.query(
      `ALTER TABLE "nutritionist_profile" ADD "city" character varying`,
    );
    await queryRunner.query(
      `UPDATE "nutritionist_profile" SET "city" = "city_el"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nutritionist_profile" DROP COLUMN "city_el"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nutritionist_profile" DROP COLUMN "city_en"`,
    );

    // bio
    await queryRunner.query(
      `ALTER TABLE "nutritionist_profile" ADD "bio" text`,
    );
    await queryRunner.query(
      `UPDATE "nutritionist_profile" SET "bio" = "bio_el"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nutritionist_profile" DROP COLUMN "bio_el"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nutritionist_profile" DROP COLUMN "bio_en"`,
    );
  }
}
