import {
  Arg,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { UserArticleFavorite } from '../entities/User/UserArticleFavorite';
import { Article } from '../entities/Nutritionist/Article';
import { isAuth } from '../middleware/isAuth';
import { MyContext } from '../types';

@Resolver(UserArticleFavorite)
export class ArticleFavoritesResolver {
  @Query(() => [UserArticleFavorite])
  @UseMiddleware(isAuth)
  async myArticleFavorites(
    @Ctx() { req }: MyContext,
    @Arg('limit', () => Int, { defaultValue: 10 }) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
  ): Promise<UserArticleFavorite[]> {
    return UserArticleFavorite.find({
      where: { userId: req.session.userId },
      relations: ['article', 'article.creator'],
      order: { savedAt: 'DESC' },
      take: Math.min(limit, 50),
      skip: offset,
    });
  }

  @Mutation(() => UserArticleFavorite)
  @UseMiddleware(isAuth)
  async saveArticle(
    @Arg('articleId', () => Int) articleId: number,
    @Ctx() { req }: MyContext,
  ): Promise<UserArticleFavorite> {
    const article = await Article.findOne({ where: { id: articleId } });
    if (!article) {
      throw new Error('Το άρθρο δεν βρέθηκε.');
    }
    const existing = await UserArticleFavorite.findOne({
      where: { userId: req.session.userId, articleId },
    });

    if (existing) return existing;

    return UserArticleFavorite.create({
      userId: req.session.userId,
      articleId,
    }).save();
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async unsaveArticle(
    @Arg('articleId', () => Int) articleId: number,
    @Ctx() { req }: MyContext,
  ): Promise<boolean> {
    const favorite = await UserArticleFavorite.findOne({
      where: { userId: req.session.userId, articleId },
    });
    if (!favorite) return false;
    await UserArticleFavorite.remove(favorite);
    return true;
  }

  @Query(() => Boolean)
  @UseMiddleware(isAuth)
  async isArticleFavorited(
    @Arg('articleId', () => Int) articleId: number,
    @Ctx() { req }: MyContext,
  ): Promise<boolean> {
    const favorite = await UserArticleFavorite.findOne({
      where: { userId: req.session.userId, articleId },
    });
    return !!favorite;
  }
}
