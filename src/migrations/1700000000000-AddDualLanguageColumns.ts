import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds dual-language (_el / _en) columns to Recipe, Step, Article, MealScheduler.
 *
 * Strategy per field:
 * 1. Add the _el column (nullable)
 * 2. Copy existing data into _el
 * 3. Set _el NOT NULL
 * 4. Add _en column with empty string default (filled by app going forward)
 * 5. Drop the original single-language column
 *
 * Existing rows will have their original text preserved in _el.
 * The _en columns on existing rows will be empty strings — they get
 * populated the next time a user edits and saves that record.
 */
export class AddDualLanguageColumns1700000000000 implements MigrationInterface {
  name = 'AddDualLanguageColumns1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Recipe ────────────────────────────────────────────────────────

    // title
    await queryRunner.query(
      `ALTER TABLE "recipe" ADD "title_el" character varying`,
    );
    await queryRunner.query(`UPDATE "recipe" SET "title_el" = "title"`);
    await queryRunner.query(
      `ALTER TABLE "recipe" ALTER COLUMN "title_el" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe" ADD "title_en" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(`ALTER TABLE "recipe" DROP COLUMN "title"`);

    // description (nullable — keep nullable in both columns)
    await queryRunner.query(`ALTER TABLE "recipe" ADD "description_el" text`);
    await queryRunner.query(
      `UPDATE "recipe" SET "description_el" = "description"`,
    );
    await queryRunner.query(`ALTER TABLE "recipe" ADD "description_en" text`);
    await queryRunner.query(`ALTER TABLE "recipe" DROP COLUMN "description"`);

    // chefComment (nullable)
    await queryRunner.query(`ALTER TABLE "recipe" ADD "chefComment_el" text`);
    await queryRunner.query(
      `UPDATE "recipe" SET "chefComment_el" = "chefComment"`,
    );
    await queryRunner.query(`ALTER TABLE "recipe" ADD "chefComment_en" text`);
    await queryRunner.query(`ALTER TABLE "recipe" DROP COLUMN "chefComment"`);

    // ── Step ──────────────────────────────────────────────────────────

    // body
    await queryRunner.query(`ALTER TABLE "step" ADD "body_el" text`);
    await queryRunner.query(`UPDATE "step" SET "body_el" = "body"`);
    await queryRunner.query(
      `ALTER TABLE "step" ALTER COLUMN "body_el" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "step" ADD "body_en" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(`ALTER TABLE "step" DROP COLUMN "body"`);

    // ── Article ───────────────────────────────────────────────────────

    // title
    await queryRunner.query(
      `ALTER TABLE "article" ADD "title_el" character varying`,
    );
    await queryRunner.query(`UPDATE "article" SET "title_el" = "title"`);
    await queryRunner.query(
      `ALTER TABLE "article" ALTER COLUMN "title_el" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "article" ADD "title_en" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "title"`);

    // text
    await queryRunner.query(`ALTER TABLE "article" ADD "text_el" text`);
    await queryRunner.query(`UPDATE "article" SET "text_el" = "text"`);
    await queryRunner.query(
      `ALTER TABLE "article" ALTER COLUMN "text_el" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "article" ADD "text_en" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "text"`);

    // ── MealScheduler ─────────────────────────────────────────────────

    // comment
    await queryRunner.query(
      `ALTER TABLE "meal_scheduler" ADD "comment_el" text`,
    );
    await queryRunner.query(
      `UPDATE "meal_scheduler" SET "comment_el" = "comment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_scheduler" ALTER COLUMN "comment_el" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_scheduler" ADD "comment_en" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_scheduler" DROP COLUMN "comment"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ── MealScheduler ─────────────────────────────────────────────────

    await queryRunner.query(`ALTER TABLE "meal_scheduler" ADD "comment" text`);
    await queryRunner.query(
      `UPDATE "meal_scheduler" SET "comment" = "comment_el"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_scheduler" ALTER COLUMN "comment" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_scheduler" DROP COLUMN "comment_el"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_scheduler" DROP COLUMN "comment_en"`,
    );

    // ── Article ───────────────────────────────────────────────────────

    await queryRunner.query(`ALTER TABLE "article" ADD "text" text`);
    await queryRunner.query(`UPDATE "article" SET "text" = "text_el"`);
    await queryRunner.query(
      `ALTER TABLE "article" ALTER COLUMN "text" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "text_el"`);
    await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "text_en"`);

    await queryRunner.query(
      `ALTER TABLE "article" ADD "title" character varying`,
    );
    await queryRunner.query(`UPDATE "article" SET "title" = "title_el"`);
    await queryRunner.query(
      `ALTER TABLE "article" ALTER COLUMN "title" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "title_el"`);
    await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "title_en"`);

    // ── Step ──────────────────────────────────────────────────────────

    await queryRunner.query(`ALTER TABLE "step" ADD "body" text`);
    await queryRunner.query(`UPDATE "step" SET "body" = "body_el"`);
    await queryRunner.query(
      `ALTER TABLE "step" ALTER COLUMN "body" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "step" DROP COLUMN "body_el"`);
    await queryRunner.query(`ALTER TABLE "step" DROP COLUMN "body_en"`);

    // ── Recipe ────────────────────────────────────────────────────────

    await queryRunner.query(`ALTER TABLE "recipe" ADD "chefComment" text`);
    await queryRunner.query(
      `UPDATE "recipe" SET "chefComment" = "chefComment_el"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe" DROP COLUMN "chefComment_el"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe" DROP COLUMN "chefComment_en"`,
    );

    await queryRunner.query(`ALTER TABLE "recipe" ADD "description" text`);
    await queryRunner.query(
      `UPDATE "recipe" SET "description" = "description_el"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe" DROP COLUMN "description_el"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recipe" DROP COLUMN "description_en"`,
    );

    await queryRunner.query(
      `ALTER TABLE "recipe" ADD "title" character varying`,
    );
    await queryRunner.query(`UPDATE "recipe" SET "title" = "title_el"`);
    await queryRunner.query(
      `ALTER TABLE "recipe" ALTER COLUMN "title" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "recipe" DROP COLUMN "title_el"`);
    await queryRunner.query(`ALTER TABLE "recipe" DROP COLUMN "title_en"`);
  }
}
