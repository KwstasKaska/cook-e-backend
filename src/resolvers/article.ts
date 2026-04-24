import {
  Arg,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { Article } from '../entities/Nutritionist/Article';
import { AddArticleInput, UpdateArticleInput } from './types/article-input';
import { MyContext } from '../types';
import { isAuth } from '../middleware/isAuth';
import { isNutr } from '../middleware/isNutr';
import AppDataSource from '../app-data-source';
import { ArticleResponse } from './types/article-object';
import {
  validateArticle,
  validateUpdateArticle,
} from '../utils/validateArticle';
import { translateText } from '../utils/translate';

@Resolver(Article)
export class ArticleResolver {
  // ─── Public Queries ───────────────────────────────────────────────

  @Query(() => [Article])
  async articles(
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<Article[]> {
    return AppDataSource.query(
      `SELECT a.*,
        json_build_object('id', u.id, 'username', u.username, 'email', u.email) AS creator
       FROM article a
       INNER JOIN public.user u ON u.id = a."creatorId"
       WHERE u.role = 'nutritionist'
       ORDER BY a."createdAt" DESC
       LIMIT $1 OFFSET $2`,
      [Math.min(limit, 50), offset],
    );
  }

  @Query(() => [Article])
  async articlesByNutritionist(
    @Arg('nutritionistId', () => Int) nutritionistId: number,
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<Article[]> {
    return AppDataSource.query(
      `SELECT a.*,
        json_build_object('id', u.id, 'username', u.username, 'email', u.email) AS creator
       FROM article a
       INNER JOIN public.user u ON u.id = a."creatorId"
       WHERE u.role = 'nutritionist' AND u.id = $1
       ORDER BY a."createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [nutritionistId, Math.min(limit, 50), offset],
    );
  }

  @Query(() => [Article])
  async chefArticles(
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<Article[]> {
    return AppDataSource.query(
      `SELECT a.*,
        json_build_object('id', u.id, 'username', u.username, 'email', u.email) AS creator
       FROM article a
       INNER JOIN public.user u ON u.id = a."creatorId"
       WHERE u.role = 'chef'
       ORDER BY a."createdAt" DESC
       LIMIT $1 OFFSET $2`,
      [Math.min(limit, 50), offset],
    );
  }

  @Query(() => [Article])
  async articlesByChef(
    @Arg('chefId', () => Int) chefId: number,
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<Article[]> {
    return AppDataSource.query(
      `SELECT a.*,
        json_build_object('id', u.id, 'username', u.username, 'email', u.email) AS creator
       FROM article a
       INNER JOIN public.user u ON u.id = a."creatorId"
       WHERE u.role = 'chef' AND u.id = $1
       ORDER BY a."createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [chefId, Math.min(limit, 50), offset],
    );
  }

  @Query(() => Article, { nullable: true })
  article(@Arg('id', () => Int) id: number): Promise<Article | null> {
    return Article.findOne({ where: { id } });
  }

  // ─── Nutritionist Private Queries ─────────────────────────────────

  @Query(() => [Article])
  @UseMiddleware(isAuth, isNutr)
  async myArticles(
    @Ctx() { req }: MyContext,
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<Article[]> {
    return AppDataSource.query(
      `SELECT a.*,
        json_build_object('id', u.id, 'username', u.username, 'email', u.email) AS creator
       FROM article a
       INNER JOIN public.user u ON u.id = a."creatorId"
       WHERE u.role = 'nutritionist' AND u.id = $1
       ORDER BY a."createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [req.session.userId, Math.min(limit, 50), offset],
    );
  }

  // ─── Mutations ────────────────────────────────────────────────────

  @Mutation(() => ArticleResponse)
  @UseMiddleware(isAuth)
  async createArticle(
    @Arg('data') data: AddArticleInput,
    @Ctx() { req }: MyContext,
  ): Promise<ArticleResponse> {
    const errors = validateArticle(data);
    if (errors) return { errors };

    const [title_en, text_en] = await Promise.all([
      translateText(data.title),
      translateText(data.text),
    ]);

    const article = await Article.create({
      title_el: data.title,
      title_en,
      text_el: data.text,
      text_en,
      creatorId: req.session.userId,
      image: data.image,
    }).save();

    return { article };
  }

  @Mutation(() => ArticleResponse)
  @UseMiddleware(isAuth)
  async updateArticle(
    @Arg('data') data: UpdateArticleInput,
    @Ctx() { req }: MyContext,
  ): Promise<ArticleResponse | null> {
    const errors = validateUpdateArticle(data);
    if (errors) return { errors };

    const [title_en, text_en] = await Promise.all([
      data.title ? translateText(data.title) : Promise.resolve(undefined),
      data.text ? translateText(data.text) : Promise.resolve(undefined),
    ]);

    const updatedFields: any = {};

    if (data.title !== undefined) {
      updatedFields.title_el = data.title;
      updatedFields.title_en = title_en;
    }
    if (data.text !== undefined) {
      updatedFields.text_el = data.text;
      updatedFields.text_en = text_en;
    }
    if (data.image !== undefined) {
      updatedFields.image = data.image;
    }

    const result = await AppDataSource.createQueryBuilder()
      .update(Article)
      .set(updatedFields)
      .where('id = :id AND "creatorId" = :creatorId', {
        id: data.id,
        creatorId: req.session.userId,
      })
      .returning('*')
      .execute();

    return { article: result.raw[0] };
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deleteArticle(
    @Arg('id', () => Int) id: number,
    @Ctx() { req }: MyContext,
  ): Promise<boolean> {
    const article = await Article.findOne({
      where: { id, creatorId: req.session.userId },
    });

    if (!article) return false;

    await Article.delete({ id });
    return true;
  }
}
