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
import { FileUpload, GraphQLUpload } from 'graphql-upload-minimal';
import { createWriteStream } from 'fs';
import path from 'path';
import { translateText } from '../utils/translate';

@Resolver(Article)
export class ArticleResolver {
  //  Public Queries

  @Query(() => [Article])
  async articles(): Promise<Article[]> {
    return AppDataSource.query(
      `SELECT a.*,
        json_build_object('id', u.id, 'username', u.username, 'email', u.email) AS creator
       FROM article a
       INNER JOIN public.user u ON u.id = a."creatorId"
       WHERE u.role = 'nutritionist'
       ORDER BY a."createdAt" DESC`,
    );
  }

  @Query(() => [Article])
  async articlesByNutritionist(
    @Arg('nutritionistId', () => Int) nutritionistId: number,
  ): Promise<Article[]> {
    return AppDataSource.query(
      `SELECT a.*,
        json_build_object('id', u.id, 'username', u.username, 'email', u.email) AS creator
       FROM article a
       INNER JOIN public.user u ON u.id = a."creatorId"
       WHERE u.role = 'nutritionist' AND u.id = $1
       ORDER BY a."createdAt" DESC`,
      [nutritionistId],
    );
  }

  @Query(() => [Article])
  async chefArticles(): Promise<Article[]> {
    return AppDataSource.query(
      `SELECT a.*,
        json_build_object('id', u.id, 'username', u.username, 'email', u.email) AS creator
       FROM article a
       INNER JOIN public.user u ON u.id = a."creatorId"
       WHERE u.role = 'chef'
       ORDER BY a."createdAt" DESC`,
    );
  }

  @Query(() => [Article])
  async articlesByChef(
    @Arg('chefId', () => Int) chefId: number,
  ): Promise<Article[]> {
    return AppDataSource.query(
      `SELECT a.*,
        json_build_object('id', u.id, 'username', u.username, 'email', u.email) AS creator
       FROM article a
       INNER JOIN public.user u ON u.id = a."creatorId"
       WHERE u.role = 'chef' AND u.id = $1
       ORDER BY a."createdAt" DESC`,
      [chefId],
    );
  }

  @Query(() => Article, { nullable: true })
  article(@Arg('id', () => Int) id: number): Promise<Article | null> {
    return Article.findOne({ where: { id } });
  }

  // ─── Nutritionist Private Queries ─────────────────────────────────

  @Query(() => [Article])
  @UseMiddleware(isAuth, isNutr)
  async myArticles(@Ctx() { req }: MyContext): Promise<Article[]> {
    return AppDataSource.query(
      `SELECT a.*,
        json_build_object('id', u.id, 'username', u.username, 'email', u.email) AS creator
       FROM article a
       INNER JOIN public.user u ON u.id = a."creatorId"
       WHERE u.role = 'nutritionist' AND u.id = $1
       ORDER BY a."createdAt" DESC`,
      [req.session.userId],
    );
  }

  // Mutations

  @Mutation(() => ArticleResponse)
  @UseMiddleware(isAuth, isNutr)
  async createArticle(
    @Arg('data') data: AddArticleInput,
    @Arg('picture', () => GraphQLUpload) picture: FileUpload,
    @Ctx() { req }: MyContext,
  ): Promise<ArticleResponse> {
    const errors = validateArticle(data);
    if (errors) return { errors };

    // Translate title and text from Greek to English before saving
    const [title_en, text_en] = await Promise.all([
      translateText(data.title),
      translateText(data.text),
    ]);

    const { createReadStream, filename } = picture;
    const imagePath = path.join(__dirname, `../../public/images/${filename}`);

    return new Promise(async (resolve, reject) => {
      createReadStream()
        .pipe(createWriteStream(imagePath))
        .on('finish', async () => {
          const article = await Article.create({
            title_el: data.title,
            title_en,
            text_el: data.text,
            text_en,
            creatorId: req.session.userId,
            image: `http://localhost:4000/images/${filename}`,
          }).save();
          resolve({ article });
        })
        .on('error', (error) => {
          console.error('Error writing file:', error);
          reject(false);
        });
    });
  }

  @Mutation(() => ArticleResponse)
  @UseMiddleware(isAuth, isNutr)
  async updateArticle(
    @Arg('data') data: UpdateArticleInput,
    @Arg('picture', () => GraphQLUpload, { nullable: true })
    picture: FileUpload,
    @Ctx() { req }: MyContext,
  ): Promise<ArticleResponse | null> {
    const errors = validateUpdateArticle(data);
    if (errors) return { errors };

    // Only translate fields that were actually provided
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

    if (picture) {
      const { createReadStream, filename } = picture;
      const imagePath = path.join(__dirname, `../../public/images/${filename}`);

      await new Promise<void>((resolve, reject) => {
        createReadStream()
          .pipe(createWriteStream(imagePath))
          .on('finish', () => resolve())
          .on('error', (error) => {
            console.error('Error writing file:', error);
            reject(error);
          });
      });

      updatedFields.image = `http://localhost:4000/images/${filename}`;
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
  @UseMiddleware(isAuth, isNutr)
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
