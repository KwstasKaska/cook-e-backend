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
import { translateBilingual } from '../utils/translate';
import { UserRole } from '../entities/General/Information';

@Resolver(Article)
export class ArticleResolver {
  @Query(() => [Article])
  async articles(
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<Article[]> {
    return Article.find({
      relations: ['creator'],
      where: { creator: { role: UserRole.NUTRITIONIST } },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 50),
      skip: offset,
    });
  }

  @Query(() => [Article])
  async articlesByNutritionist(
    @Arg('nutritionistId', () => Int) nutritionistId: number,
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<Article[]> {
    return Article.find({
      relations: ['creator'],
      where: {
        creatorId: nutritionistId,
        creator: { role: UserRole.NUTRITIONIST },
      },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 50),
      skip: offset,
    });
  }

  @Query(() => [Article])
  async chefArticles(
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<Article[]> {
    return Article.find({
      relations: ['creator'],
      where: { creator: { role: UserRole.CHEF } },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 50),
      skip: offset,
    });
  }

  @Query(() => [Article])
  async articlesByChef(
    @Arg('chefId', () => Int) chefId: number,
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<Article[]> {
    return Article.find({
      relations: ['creator'],
      where: { creatorId: chefId, creator: { role: UserRole.CHEF } },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 50),
      skip: offset,
    });
  }

  @Query(() => Article, { nullable: true })
  article(@Arg('id', () => Int) id: number): Promise<Article | null> {
    return Article.findOne({ where: { id }, relations: ['creator'] });
  }

  @Query(() => [Article])
  @UseMiddleware(isAuth, isNutr)
  async myArticles(
    @Ctx() { req }: MyContext,
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<Article[]> {
    return Article.find({
      relations: ['creator'],
      where: { creatorId: req.session.userId },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 50),
      skip: offset,
    });
  }

  @Mutation(() => ArticleResponse)
  @UseMiddleware(isAuth)
  async createArticle(
    @Arg('data') data: AddArticleInput,
    @Ctx() { req }: MyContext,
  ): Promise<ArticleResponse> {
    const errors = validateArticle(data);
    if (errors) return { errors };

    const [titleBi, textBi] = await Promise.all([
      translateBilingual(data.title),
      translateBilingual(data.text),
    ]);

    const article = await Article.create({
      title_el: titleBi.el,
      title_en: titleBi.en,
      text_el: textBi.el,
      text_en: textBi.en,
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

    const [titleBi, textBi] = await Promise.all([
      data.title ? translateBilingual(data.title) : Promise.resolve(undefined),
      data.text ? translateBilingual(data.text) : Promise.resolve(undefined),
    ]);

    const updatedFields: any = {};

    if (data.title !== undefined) {
      updatedFields.title_el = titleBi!.el;
      updatedFields.title_en = titleBi!.en;
    }
    if (data.text !== undefined) {
      updatedFields.text_el = textBi!.el;
      updatedFields.text_en = textBi!.en;
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
